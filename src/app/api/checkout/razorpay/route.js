import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Client must sign in to checkout' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized: Session expired' }, { status: 401 });
    }

    const { items, couponCode, shippingAddress } = await request.json();

    if (!items || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ error: 'Missing items or shipping address' }, { status: 400 });
    }

    // 1. RECALCULATE PRICES SERVER-SIDE TO PREVENT PRICE TAMPERING
    const productIds = items.map((i) => i.id);
    const dbResult = await pool.query(
      'SELECT id, name, price, variants, is_out_of_stock FROM products WHERE id = ANY($1)',
      [productIds]
    );

    const dbProducts = {};
    dbResult.rows.forEach((p) => {
      dbProducts[p.id] = p;
    });

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProduct = dbProducts[item.id];
      if (!dbProduct) {
        return NextResponse.json({ error: `Product ID ${item.id} not found in catalog` }, { status: 400 });
      }

      if (dbProduct.is_out_of_stock) {
        return NextResponse.json({ error: `Product "${dbProduct.name}" is out of stock` }, { status: 400 });
      }

      // Check stock level for the specific variant
      const variants = dbProduct.variants || [];
      const dbVariant = variants.find(
        (v) => v.size === item.size && v.color === item.color
      );

      if (!dbVariant || dbVariant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${dbProduct.name}" in Size ${item.size} / Color ${item.color}` },
          { status: 400 }
        );
      }

      const itemPrice = parseFloat(dbProduct.price);
      subtotal += itemPrice * item.quantity;
      verifiedItems.push({
        id: item.id,
        slug: item.slug,
        name: dbProduct.name,
        price: itemPrice,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
    }

    // 2. VALIDATE COUPON CODE SERVER-SIDE
    let discountAmount = 0;
    let appliedCode = null;

    if (couponCode) {
      const codeUpper = couponCode.toUpperCase().trim();
      const couponResult = await pool.query(
        'SELECT * FROM coupons WHERE code = $1 AND active = true AND expiry_date > NOW()',
        [codeUpper]
      );

      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];
        if (coupon.times_used < coupon.usage_limit) {
          appliedCode = coupon.code;
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
          } else {
            discountAmount = Math.min(subtotal, parseFloat(coupon.discount_value));
          }
        }
      }
    }

    // Calculate shipping (free above 10,000, else 250)
    const shippingFee = subtotal >= 10000 ? 0 : 250;
    const finalTotal = subtotal - discountAmount + shippingFee;

    // 3. CREATE ORDER IN DATABASE (PENDING STATE)
    const orderInsertResult = await pool.query(
      `INSERT INTO orders (user_id, items, status, shipping_address, payment_status, coupon_code, discount_amount, total)
       VALUES ($1, $2, 'Pending', $3, 'Pending', $4, $5, $6)
       RETURNING id`,
      [
        decoded.id,
        JSON.stringify(verifiedItems),
        JSON.stringify(shippingAddress),
        appliedCode,
        discountAmount,
        finalTotal,
      ]
    );

    const orderId = orderInsertResult.rows[0].id;

    // 4. INITIALIZE RAZORPAY ORDER
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isDev = process.env.NODE_ENV === 'development';

    if (!keyId || !keySecret) {
      if (isDev) {
        // Fallback for local development: create mock order ID
        const mockRazorpayOrderId = `order_mock_${orderId}_${Math.random().toString(36).substring(2, 10)}`;
        await pool.query(
          'UPDATE orders SET razorpay_order_id = $1 WHERE id = $2',
          [mockRazorpayOrderId, orderId]
        );

        return NextResponse.json({
          mock: true,
          amount: Math.round(finalTotal * 100), // In paise
          currency: 'INR',
          razorpay_order_id: mockRazorpayOrderId,
          order_id: orderId,
        });
      } else {
        // Enforce configuration in production environment - abort immediately
        console.error('CRITICAL: Razorpay keys are missing in production environment.');
        return NextResponse.json(
          { error: 'Server configuration error: payment keys missing' },
          { status: 500 }
        );
      }
    }

    // Standard Razorpay Order Creation
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(finalTotal * 100), // Razorpay accepts values in sub-units (paise)
        currency: 'INR',
        receipt: `receipt_order_${orderId}`,
      });

      // Update order in database with the Razorpay order ID
      await pool.query(
        'UPDATE orders SET razorpay_order_id = $1 WHERE id = $2',
        [rzpOrder.id, orderId]
      );

      return NextResponse.json({
        mock: false,
        key_id: keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        razorpay_order_id: rzpOrder.id,
        order_id: orderId,
      });
    } catch (rzpErr) {
      console.error('Razorpay API error:', rzpErr);
      return NextResponse.json({ error: 'Failed to create payment order with processor' }, { status: 500 });
    }
  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
