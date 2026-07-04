import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch site visits trend (grouped daily)
    const visitsResult = await pool.query(`
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD') as date, 
        COUNT(id)::int as visits 
      FROM page_visits 
      WHERE timestamp > NOW() - INTERVAL '30 days'
      GROUP BY date 
      ORDER BY date ASC
    `);

    // 2. Fetch revenue metrics (paid orders)
    const revenueResult = await pool.query(`
      SELECT 
        COUNT(id)::int as order_count, 
        COALESCE(SUM(total), 0)::float as revenue 
      FROM orders 
      WHERE payment_status = 'Paid'
    `);
    const metrics = revenueResult.rows[0];

    // 3. Fetch orders to calculate best-selling items
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

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.sales_count - a.sales_count)
      .slice(0, 5);

    // 4. Fetch all products to compile low stock alerts
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

    // 5. Fetch registered customers list
    const customersResult = await pool.query(`
      SELECT id, name, email, created_at 
      FROM users 
      WHERE role = 'customer' 
      ORDER BY id DESC
    `);

    // 6. Fetch newsletter subscribers list
    const subscribersResult = await pool.query(`
      SELECT email, subscribed_at 
      FROM newsletter_subscribers 
      ORDER BY subscribed_at DESC
    `);

    return NextResponse.json({
      visitsTrend: visitsResult.rows,
      metrics: {
        totalOrders: metrics.order_count,
        totalRevenue: metrics.revenue,
      },
      bestSellers,
      lowStockAlerts,
      customers: customersResult.rows,
      subscribers: subscribersResult.rows,
    });
  } catch (error) {
    console.error('Fetch admin analytics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
