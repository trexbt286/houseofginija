import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    const codeUpper = code.toUpperCase().trim();

    // Query coupon details from Postgres
    const result = await pool.query(
      'SELECT * FROM coupons WHERE code = $1',
      [codeUpper]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 });
    }

    const coupon = result.rows[0];

    // Validate active state
    if (!coupon.active) {
      return NextResponse.json({ error: 'This promo code is no longer active' }, { status: 400 });
    }

    // Validate expiry date
    const expiry = new Date(coupon.expiry_date);
    if (expiry < new Date()) {
      return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 });
    }

    // Validate usage limit
    if (coupon.times_used >= coupon.usage_limit) {
      return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 400 });
    }

    // Return valid coupon properties
    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
