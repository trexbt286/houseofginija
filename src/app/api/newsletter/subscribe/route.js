import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if email already exists in subscribers list
    const checkResult = await pool.query(
      'SELECT 1 FROM newsletter_subscribers WHERE email = $1',
      [emailLower]
    );

    if (checkResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO newsletter_subscribers (email) VALUES ($1)',
        [emailLower]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
