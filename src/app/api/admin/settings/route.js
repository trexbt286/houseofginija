import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'local-settings.json');

// In-memory fallback store for settings when DB or disk is being accessed
const inMemorySettings = {};

function readLocalSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      return JSON.parse(data || '{}');
    }
  } catch (err) {
    console.error('Error reading local-settings.json:', err);
  }
  return {};
}

function writeLocalSettings(newSettings) {
  try {
    const existing = readLocalSettings();
    const updated = { ...existing, ...newSettings };
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local-settings.json:', err);
  }
}

// GET settings
export async function GET() {
  const mergedSettings = { ...readLocalSettings() };

  try {
    const result = await pool.query('SELECT key, value FROM settings');
    result.rows.forEach((row) => {
      mergedSettings[row.key] = row.value;
    });
  } catch (error) {
    // Database connection optional in fallback mode
  }

  // Merge in-memory overrides on top
  Object.assign(mergedSettings, inMemorySettings);

  return NextResponse.json({ settings: mergedSettings });
}

// POST update settings
export async function POST(request) {
  try {
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    // 1. Update in-memory store
    Object.assign(inMemorySettings, settings);

    // 2. Persist to disk JSON file
    writeLocalSettings(settings);

    // 3. Attempt DB persistence for settings table and collections.image_url
    try {
      for (const [key, value] of Object.entries(settings)) {
        // Upsert into settings table
        await pool.query(
          `INSERT INTO settings (key, value)
           VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, String(value)]
        );

        // If this is a category thumbnail setting, update the collections table as well
        if (key.startsWith('category_img_') && value) {
          const categorySlug = key.replace('category_img_', '');
          await pool.query(
            `UPDATE collections SET image_url = $1 WHERE slug = $2`,
            [String(value), categorySlug]
          );
        }
      }
    } catch (dbError) {
      console.warn('DB settings write failed, using disk JSON and in-memory store:', dbError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin POST settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
