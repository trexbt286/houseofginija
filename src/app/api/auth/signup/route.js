import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower]);
    if (checkUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Hardcode role to 'customer' server-side for safety (ignores any custom role injection)
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, \'customer\') RETURNING id, name, email, role',
      [name.trim(), emailLower, passwordHash]
    );

    const user = newUser.rows[0];

    // Generate JWT token
    const token = await signJWT({ id: user.id, name: user.name, email: user.email, role: user.role });

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
