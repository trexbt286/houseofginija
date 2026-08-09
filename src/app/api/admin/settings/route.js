import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getRuntimeSettings, updateRuntimeSettings } from '@/lib/settingsStore';

export const dynamic = 'force-dynamic';

// GET settings
export async function GET() {
  const mergedSettings = { ...getRuntimeSettings() };

  try {
    const result = await pool.query('SELECT key, value FROM settings');
    result.rows.forEach((row) => {
      mergedSettings[row.key] = row.value;
    });
  } catch (error) {
    // Database connection optional in fallback mode
  }

  return NextResponse.json({ settings: mergedSettings });
}

// POST update settings
export async function POST(request) {
  try {
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    // Update runtime singleton store & disk
    const updated = updateRuntimeSettings(settings);

    // Attempt DB persistence for settings table and collections.image_url
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
