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

export async function POST(request) {
  try {
    const { items, couponCode } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    // Query flash sale enabled setting
    const settingsResult = await pool.query("SELECT value FROM settings WHERE key = 'flash_sale_enabled'");
    const flashSaleEnabled = settingsResult.rows.length > 0 ? settingsResult.rows[0].value === 'true' : false;

    // Recalculate prices using flash_sale_price if applicable
    const productIds = items.map((i) => i.id);
    const dbResult = await pool.query(
      'SELECT id, price, flash_sale, flash_sale_price FROM products WHERE id = ANY($1)',
      [productIds]
    );

    const dbProducts = {};
    dbResult.rows.forEach((p) => {
      dbProducts[p.id] = p;
    });

    let subtotal = 0;
    for (const item of items) {
      const dbProduct = dbProducts[item.id];
      if (dbProduct) {
        const isFlashActive = flashSaleEnabled && dbProduct.flash_sale && dbProduct.flash_sale_price;
        const itemPrice = isFlashActive ? parseFloat(dbProduct.flash_sale_price) : parseFloat(dbProduct.price);
        subtotal += itemPrice * item.quantity;
      }
    }

    let discountAmount = 0;
    let valid = false;
    let coupon = null;

    if (couponCode) {
      const codeUpper = couponCode.toUpperCase().trim();
      const couponResult = await pool.query(
        'SELECT * FROM coupons WHERE code = $1 AND active = true AND expiry_date > NOW()',
        [codeUpper]
      );

      if (couponResult.rows.length > 0) {
        coupon = couponResult.rows[0];
        if (coupon.times_used < coupon.usage_limit) {
          valid = true;
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
          } else {
            discountAmount = Math.min(subtotal, parseFloat(coupon.discount_value));
          }
        }
      }
    }

    return NextResponse.json({
      valid,
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
    });
  } catch (error) {
    console.error('Coupon validation POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

