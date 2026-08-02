import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const resultData = {
    visitsTrend: [],
    metrics: { totalOrders: 0, totalRevenue: 0 },
    bestSellers: [],
    lowStockAlerts: [],
    customers: [],
    subscribers: [],
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(resultData);
  }

  try {
    // 1. Fetch site visits trend (grouped daily)
    try {
      const visitsResult = await pool.query(`
        SELECT 
          TO_CHAR(timestamp, 'YYYY-MM-DD') as date, 
          COUNT(id)::int as visits 
        FROM page_visits 
        WHERE timestamp > NOW() - INTERVAL '30 days'
        GROUP BY date 
        ORDER BY date ASC
      `);
      resultData.visitsTrend = visitsResult.rows || [];
    } catch (e) {
      console.warn('Analytics visits query skipped:', e.message);
    }

    // 2. Fetch revenue metrics (paid orders)
    try {
      const revenueResult = await pool.query(`
        SELECT 
          COUNT(id)::int as order_count, 
          COALESCE(SUM(total), 0)::float as revenue 
        FROM orders 
        WHERE payment_status = 'Paid'
      `);
      if (revenueResult.rows.length > 0) {
        const metrics = revenueResult.rows[0];
        resultData.metrics = {
          totalOrders: metrics.order_count || 0,
          totalRevenue: metrics.revenue || 0,
        };
      }
    } catch (e) {
      console.warn('Analytics revenue query skipped:', e.message);
    }

    // 3. Fetch orders to calculate best-selling items
    try {
      const ordersResult = await pool.query(`
        SELECT items FROM orders WHERE payment_status = 'Paid'
      `);
      
      const productSales = {};
      ordersResult.rows.forEach(order => {
        const items = order.items || [];
        items.forEach(item => {
          if (!productSales[item.id]) {
            productSales[item.id] = {
              id: item.id,
              name: item.name,
              sales_count: 0,
              revenue: 0,
            };
          }
          productSales[item.id].sales_count += item.quantity;
          productSales[item.id].revenue += item.price * item.quantity;
        });
      });

      resultData.bestSellers = Object.values(productSales)
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 5);
    } catch (e) {
      console.warn('Analytics best sellers query skipped:', e.message);
    }

    // 4. Fetch all products to compile low stock alerts
    try {
      const productsResult = await pool.query(`
        SELECT id, name, variants, is_out_of_stock FROM products
      `);

      const lowStockAlerts = [];
      productsResult.rows.forEach(product => {
        const variants = product.variants || [];
        variants.forEach(v => {
          if (v.stock <= 3 && !product.is_out_of_stock) {
            lowStockAlerts.push({
              id: product.id,
              name: product.name,
              size: v.size,
              color: v.color,
              stock: v.stock,
            });
          }
        });
      });
      resultData.lowStockAlerts = lowStockAlerts;
    } catch (e) {
      console.warn('Analytics low stock query skipped:', e.message);
    }

    // 5. Fetch registered customers list
    try {
      const customersResult = await pool.query(`
        SELECT id, name, email, created_at 
        FROM users 
        WHERE role = 'customer' 
        ORDER BY id DESC
      `);
      resultData.customers = customersResult.rows || [];
    } catch (e) {
      console.warn('Analytics customers query skipped:', e.message);
    }

    // 6. Fetch newsletter subscribers list
    try {
      const subscribersResult = await pool.query(`
        SELECT email, subscribed_at 
        FROM newsletter_subscribers 
        ORDER BY subscribed_at DESC
      `);
      resultData.subscribers = subscribersResult.rows || [];
    } catch (e) {
      console.warn('Analytics subscribers query skipped:', e.message);
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Fetch admin analytics error:', error);
    return NextResponse.json(resultData);
  }
}
