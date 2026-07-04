import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all coupons
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY expiry_date DESC');
    return NextResponse.json({ coupons: result.rows });
  } catch (error) {
    console.error('Admin GET coupons error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a coupon
export async function POST(request) {
  try {
    const { code, discount_type, discount_value, expiry_date, usage_limit, active } = await request.json();

    if (!code || !discount_type || !discount_value || !expiry_date || !usage_limit) {
      return NextResponse.json({ error: 'Missing required coupon properties' }, { status: 400 });
    }

    const codeUpper = code.toUpperCase().trim();
    const discountValNum = parseFloat(discount_value);
    const usageLimitNum = parseInt(usage_limit, 10);
    const activeBool = active !== false;

    const result = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, expiry_date, usage_limit, times_used, active)
       VALUES ($1, $2, $3, $4, $5, 0, $6)
       RETURNING *`,
      [codeUpper, discount_type, discountValNum, expiry_date, usageLimitNum, activeBool]
    );

    return NextResponse.json({ success: true, coupon: result.rows[0] });
  } catch (error) {
    console.error('Admin POST coupon error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Coupon with this code already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update a coupon
export async function PUT(request) {
  try {
    const { code, discount_type, discount_value, expiry_date, usage_limit, active } = await request.json();

    if (!code || !discount_type || !discount_value || !expiry_date || !usage_limit) {
      return NextResponse.json({ error: 'Missing required coupon properties for update' }, { status: 400 });
    }

    const discountValNum = parseFloat(discount_value);
    const usageLimitNum = parseInt(usage_limit, 10);
    const activeBool = active !== false;

    const result = await pool.query(
      `UPDATE coupons 
       SET discount_type = $1, discount_value = $2, expiry_date = $3, usage_limit = $4, active = $5
       WHERE code = $6
       RETURNING *`,
      [discount_type, discountValNum, expiry_date, usageLimitNum, activeBool, code.toUpperCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: result.rows[0] });
  } catch (error) {
    console.error('Admin PUT coupon error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a coupon
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing coupon code' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM coupons WHERE code = $1 RETURNING code', [code.toUpperCase().trim()]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedCode: code });
  } catch (error) {
    console.error('Admin DELETE coupon error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
