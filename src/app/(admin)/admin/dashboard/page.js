'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminDashboard() {
  const { user, logout } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) {
          throw new Error('Failed to retrieve analytics data.');
        }
        const analyticsData = await res.json();
        setData(analyticsData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error fetching analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Set up real-time polling to sync order placement instantly
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={loadingContainerStyle}>Curating metrics...</div>;
  }

  if (error || !data) {
    return (
      <div style={errorContainerStyle}>
        <h2>Analytics Load Failure</h2>
        <p>{error || 'Unable to access administration dataset.'}</p>
      </div>
    );
  }

  const { metrics, bestSellers, lowStockAlerts, visitsTrend, customers, subscribers } = data;

  // Custom SVG Bar Chart calculation
  const maxVisits = visitsTrend.length > 0 ? Math.max(...visitsTrend.map(v => v.visits), 10) : 10;
  const chartHeight = 160;

  return (
    <div style={dashboardLayoutStyle} className="admin-page-root animate-fade-in">
      {/* Sidebar */}
      <AdminSidebar active="dashboard" />

      {/* Main Panel */}
      <main style={mainPanelStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Dashboard Overview</h1>
            <p style={subtitleStyle}>Real-time activities and sales telemetry.</p>
          </div>
          <div style={headerRightActionsStyle}>
            <Link href="/" style={headerVisitStoreBtnStyle}>
              Visit Storefront
            </Link>
            <button onClick={logout} style={headerLogoutBtnStyle}>
              Sign Out
            </button>
            <div style={adminProfileCardStyle}>
              <span style={adminProfileNameStyle}>{user ? user.name : 'Administrator'}</span>
              <span style={adminProfileEmailStyle}>{user ? user.email : 'admin@houseofginija.com'}</span>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <div style={metricsGridStyle}>
          <div style={metricCardStyle}>
            <span style={metricLabelStyle}>Promotion Revenue</span>
            <span style={metricValueStyle}>₹{metrics.totalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div style={metricCardStyle}>
            <span style={metricLabelStyle}>Orders Captured</span>
            <span style={metricValueStyle}>{metrics.totalOrders}</span>
          </div>
          <div style={metricCardStyle}>
            <span style={metricLabelStyle}>Registered Customers</span>
            <span style={metricValueStyle}>{customers.length}</span>
          </div>
          <div style={metricCardStyle}>
            <span style={metricLabelStyle}>Newsletter Circle</span>
            <span style={metricValueStyle}>{subscribers.length}</span>
          </div>
        </div>

        {/* Visits & Low Stock Alerts Grid */}
        <div style={splitGridStyle} className="admin-split-grid">
          {/* SVG Site Visits Trend Chart */}
          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Site Visits (Last 30 Days)</h3>
            <div style={chartContainerStyle}>
              {visitsTrend.length === 0 ? (
                <div style={emptyStateStyle}>No visit telemetry recorded yet.</div>
              ) : (
                <div style={svgChartWrapperStyle}>
                  <svg width="100%" height={chartHeight} viewBox={`0 0 500 ${chartHeight}`} preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1={chartHeight * 0.25} x2="500" y2={chartHeight * 0.25} stroke="rgba(60, 48, 58, 0.05)" strokeWidth="1" />
                    <line x1="0" y1={chartHeight * 0.5} x2="500" y2={chartHeight * 0.5} stroke="rgba(60, 48, 58, 0.05)" strokeWidth="1" />
                    <line x1="0" y1={chartHeight * 0.75} x2="500" y2={chartHeight * 0.75} stroke="rgba(60, 48, 58, 0.05)" strokeWidth="1" />
                    
                    {/* Render Bars */}
                    {visitsTrend.map((v, idx) => {
                      const barWidth = 10;
                      const gap = (500 - visitsTrend.length * barWidth) / (visitsTrend.length + 1);
                      const x = gap + idx * (barWidth + gap);
                      const barHeight = (v.visits / maxVisits) * (chartHeight - 40);
                      const y = chartHeight - 30 - barHeight;

                      return (
                        <g key={idx}>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={Math.max(barHeight, 3)}
                            fill="url(#barGradient)"
                            rx="2"
                          />
                          {/* Hover tooltip hint */}
                          <text
                            x={x + barWidth / 2}
                            y={y - 6}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="bold"
                            fill="#000000"
                          >
                            {v.visits}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D98E9B" /> {/* Pink */}
                        <stop offset="100%" stopColor="#000000" /> {/* Mauve */}
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Timeline labels */}
                  <div style={chartLabelsRowStyle}>
                    <span>{visitsTrend[0]?.date}</span>
                    <span>{visitsTrend[Math.floor(visitsTrend.length / 2)]?.date}</span>
                    <span>{visitsTrend[visitsTrend.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Inventory Stock Alerts</h3>
            <div style={listContainerStyle}>
              {lowStockAlerts.length === 0 ? (
                <div style={cleanStockStyle}>
                  <span style={cleanIconStyle}>✓</span>
                  <span>All product variants fully stocked.</span>
                </div>
              ) : (
                <div style={alertsListStyle}>
                  {lowStockAlerts.map((alert, idx) => (
                    <div key={idx} style={alertItemStyle}>
                      <div>
                        <strong style={alertNameStyle}>{alert.name}</strong>
                        <span style={alertMetaStyle}>Size: {alert.size} | Color: {alert.color}</span>
                      </div>
                      <span style={alertStockBadgeStyle(alert.stock)}>
                        {alert.stock} Left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Best Sellers & Subscriptions Grid */}
        <div style={splitGridStyle} className="admin-split-grid">
          {/* Best Sellers */}
          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Top Performing Creations</h3>
            <div style={listContainerStyle}>
              {bestSellers.length === 0 ? (
                <div style={emptyStateStyle}>No transaction metrics recorded.</div>
              ) : (
                <div style={tableListStyle}>
                  {bestSellers.map((product) => (
                    <div key={product.id} style={tableRowStyle}>
                      <div>
                        <strong style={tableNameStyle}>{product.name}</strong>
                        <span style={tableSubStyle}>{product.sales_count} units sold</span>
                      </div>
                      <span style={tableValueStyle}>₹{product.revenue.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Newsletter Subscribers */}
          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Newsletter Circles ({subscribers.length})</h3>
            <div style={listContainerStyle}>
              {subscribers.length === 0 ? (
                <div style={emptyStateStyle}>No customers subscribed.</div>
              ) : (
                <div style={tableListStyle}>
                  {subscribers.slice(0, 5).map((sub, idx) => (
                    <div key={idx} style={tableRowStyle}>
                      <span style={subscriberEmailStyle}>{sub.email}</span>
                      <span style={subscriberDateStyle}>
                        {new Date(sub.subscribed_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

// Inline styles for Admin Dashboard
const dashboardLayoutStyle = {
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  minHeight: '100vh',
  backgroundColor: '#FFFFFF', // Soft Cream
};

const loadingContainerStyle = {
  textAlign: 'center',
  padding: '12rem 0',
  color: '#000000',
  fontSize: '1.2rem',
  fontFamily: 'var(--font-serif)',
  backgroundColor: '#FFFFFF',
  minHeight: '100vh',
};

const errorContainerStyle = {
  textAlign: 'center',
  padding: '8rem 2rem',
  color: '#000000',
};

// Sidebar styles removed - managed by AdminSidebar component

// Main Panel
const mainPanelStyle = {
  padding: '3rem',
  overflowY: 'auto',
};

const headerRightActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const headerVisitStoreBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid #000000',
  color: '#000000',
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  borderRadius: '4px',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const headerLogoutBtnStyle = {
  backgroundColor: '#000000',
  border: '1px solid #000000',
  color: '#FFFFFF',
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2.5rem',
  borderBottom: '1px solid rgba(60, 48, 58, 0.08)',
  paddingBottom: '1.5rem',
};

const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2.2rem',
  color: '#D98E9B',
  fontWeight: '500',
};

const subtitleStyle = {
  fontSize: '0.85rem',
  color: '#D98E9B',
};

const adminProfileCardStyle = {
  textAlign: 'right',
  display: 'flex',
  flexDirection: 'column',
};

const adminProfileNameStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#000000',
};

const adminProfileEmailStyle = {
  fontSize: '0.75rem',
  color: '#000000',
};

// Metrics Grid
const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2.5rem',
};

const metricCardStyle = {
  backgroundColor: '#FFFFFF',
  padding: '1.8rem',
  borderRadius: '6px',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid rgba(139, 119, 137, 0.1)',
};

const metricLabelStyle = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  color: '#000000',
  fontWeight: '700',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: '0.4rem',
};

const metricValueStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  color: '#000000',
};

// Split grids
const splitGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  gap: '2rem',
  marginBottom: '2rem',
  '@media (max-width: 991px)': {
    gridTemplateColumns: '1fr',
  },
};

const panelCardStyle = {
  backgroundColor: '#FFFFFF',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid rgba(139, 119, 137, 0.1)',
};

const panelTitleStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#D98E9B',
  fontWeight: '700',
  marginBottom: '1.5rem',
  borderBottom: '1px dashed rgba(60, 48, 58, 0.08)',
  paddingBottom: '0.8rem',
};

const chartContainerStyle = {
  height: '200px',
  display: 'flex',
  alignItems: 'flex-end',
};

const svgChartWrapperStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const chartLabelsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.65rem',
  color: '#000000',
  marginTop: '0.5rem',
};

const emptyStateStyle = {
  width: '100%',
  textAlign: 'center',
  padding: '3rem 0',
  color: '#000000',
  fontSize: '0.85rem',
  fontStyle: 'italic',
};

const listContainerStyle = {
  maxHeight: '200px',
  overflowY: 'auto',
};

const cleanStockStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  color: '#000000',
  fontSize: '0.9rem',
  padding: '1.5rem 0',
};

const cleanIconStyle = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
};

const alertsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const alertItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.6rem 0.8rem',
  backgroundColor: '#FFFFFF',
  borderRadius: '4px',
  borderLeft: '4px solid #c62828',
};

const alertNameStyle = {
  fontSize: '0.85rem',
  color: '#000000',
  display: 'block',
};

const alertMetaStyle = {
  fontSize: '0.72rem',
  color: '#000000',
};

const alertStockBadgeStyle = (stock) => {
  return {
    backgroundColor: '#D98E9B',
    color: '#000000',
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '0.2rem 0.5rem',
    borderRadius: '2px',
  };
};

const tableListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const tableRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.6rem',
  borderBottom: '1px solid rgba(60, 48, 58, 0.05)',
};

const tableNameStyle = {
  fontSize: '0.85rem',
  color: '#000000',
  display: 'block',
};

const tableSubStyle = {
  fontSize: '0.72rem',
  color: '#D98E9B',
};

const tableValueStyle = {
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#000000',
};

const subscriberEmailStyle = {
  fontSize: '0.85rem',
  color: '#000000',
  fontWeight: '500',
};

const subscriberDateStyle = {
  fontSize: '0.75rem',
  color: '#000000',
};
