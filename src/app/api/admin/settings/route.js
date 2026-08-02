import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// Allow up to 5 MB JSON bodies (compressed images are ~80 KB but give headroom)
export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

// In-memory fallback store for settings when DB is unavailable
const inMemorySettings = {};

// GET settings
export async function GET() {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    // Merge in-memory overrides on top (in case DB is missing category_img_ keys)
    Object.assign(settings, inMemorySettings);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Admin GET settings error:', error);
    // Return in-memory settings as fallback
    return NextResponse.json({ settings: { ...inMemorySettings } });
  }
}

// POST update settings
export async function POST(request) {
  try {
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    // Always persist to in-memory store so ShopByCategories picks them up immediately
    Object.assign(inMemorySettings, settings);

    // Attempt DB persistence
    try {
      for (const [key, value] of Object.entries(settings)) {
        await pool.query(
          `INSERT INTO settings (key, value)
           VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, String(value)]
        );
      }
    } catch (dbError) {
      console.warn('DB settings write failed, using in-memory store:', dbError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin POST settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
