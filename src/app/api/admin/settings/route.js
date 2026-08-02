import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET settings
export async function GET() {
  try {
    const result = await pool.query("SELECT key, value FROM settings");
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Admin GET settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST update settings
export async function POST(request) {
  try {
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `UPDATE settings SET value = $2 WHERE key = $1`,
        [key, String(value)]
      );
      await pool.query(
        `INSERT INTO settings (key, value)
         SELECT $1, $2
         WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = $1)`,
        [key, String(value)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin POST settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
