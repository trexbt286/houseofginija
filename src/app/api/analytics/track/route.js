import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let sessionId = cookieStore.get('session_id')?.value;

    // Generate session ID if not present
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : `sess_${Math.random().toString(36).substring(2, 15)}`;
      cookieStore.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2, // 2 hours session window
        path: '/',
      });
    }

    // Insert visit event to the page_visits database table
    await pool.query(
      'INSERT INTO page_visits (path, session_id) VALUES ($1, $2)',
      [path, sessionId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Return 200 OK even on failure so client page load does not throw errors
    return NextResponse.json({ success: false, error: 'Database record failed' }, { status: 200 });
  }
}
