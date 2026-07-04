'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { triggerSparkleConfetti } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Celebrate immediately on load
    triggerSparkleConfetti();

    if (orderId) {
      const fetchOrderDetails = async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          if (!res.ok) {
            throw new Error('Order not found');
          }
          const data = await res.json();
          setOrder(data.order);
        } catch (err) {
          console.error(err);
          setError('Failed to load order receipt. However, your payment was processed successfully.');
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
    } else {
      setLoading(false);
      setError('Missing order context.');
    }
  }, [orderId]);

  return (
    <div style={pageStyle} className="container animate-fade-in">
      <div style={successBoxStyle}>
        <div style={checkIconCircleStyle}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        
        <h1 style={titleStyle}>Order Confirmed</h1>
        <p style={taglineStyle}>Thank you for choosing House Of Ginija.</p>
        <p style={descriptionStyle}>
          Your order has been recorded and is currently being curated by our master pattern makers. A digital receipt has been registered to your profile account history.
        </p>

        {loading ? (
          <div style={loadingReceiptStyle}>Fetching order receipt...</div>
        ) : error ? (
          <div style={errorReceiptStyle}>{error}</div>
        ) : (
          <div style={receiptCardStyle}>
            <div style={receiptHeaderStyle}>
              <span>Order Receipt #{order.id}</span>
              <span style={orderStatusStyle}>{order.status}</span>
            </div>

            <div style={receiptDividerStyle}></div>

            <div style={itemsListStyle}>
              {order.items.map((item, idx) => (
                <div key={idx} style={itemRowStyle}>
                  <div style={itemInfoStyle}>
                    <span style={itemNameStyle}>{item.name}</span>
                    <span style={itemMetaStyle}>Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</span>
                  </div>
                  <span style={itemPriceStyle}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div style={receiptDividerStyle}></div>

            <div style={summaryRowStyle}>
              <span>Subtotal</span>
              <span>₹{(parseFloat(order.total) + parseFloat(order.discount_amount) - (parseFloat(order.total) >= 10000 ? 0 : 250)).toLocaleString('en-IN')}</span>
            </div>
            
            <div style={summaryRowStyle}>
              <span>Shipping</span>
              <span>{parseFloat(order.total) >= 10000 ? 'Complimentary' : '₹250'}</span>
            </div>

            {parseFloat(order.discount_amount) > 0 && (
              <div style={summaryRowStyle}>
                <span style={pinkTextStyle}>Promo Discount</span>
                <span style={pinkTextStyle}>- ₹{parseFloat(order.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div style={receiptDividerStyle}></div>

            <div style={totalRowStyle}>
              <span>Total Charged</span>
              <span>₹{parseFloat(order.total).toLocaleString('en-IN')}</span>
            </div>

            <div style={shippingDetailsStyle}>
              <strong style={shipTitleStyle}>Shipped To:</strong>
              <p style={shipAddressStyle}>
                {order.shipping_address.line1}
                {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}
                <br />
                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                <br />
                Phone: {order.shipping_address.phone}
              </p>
            </div>
          </div>
        )}

        <div style={actionsContainerStyle}>
          <Link href="/collections" style={btnPrimaryStyle}>
            Continue Shopping
          </Link>
          <Link href="/account" style={btnSecondaryStyle}>
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading Order Receipt...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

// Inline styles for Order Success Page
const pageStyle = {
  paddingTop: '4rem',
  paddingBottom: '6rem',
  backgroundColor: '#FFFFFF',
  display: 'flex',
  justifyContent: 'center',
};

const successBoxStyle = {
  maxWidth: '600px',
  width: '100%',
  textAlign: 'center',
  backgroundColor: '#FFFFFF',
  padding: '3rem',
  borderRadius: '8px',
  boxShadow: 'var(--shadow-md)',
  border: '1px solid rgba(139, 119, 137, 0.12)',
};

const checkIconCircleStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#D98E9B', // Pink
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 1.8rem auto',
  boxShadow: '0 8px 20px rgba(74, 52, 57, 0.08)',
};

const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2.4rem',
  color: '#D98E9B',
  marginBottom: '0.5rem',
  fontWeight: '400',
};

const taglineStyle = {
  fontFamily: 'var(--font-script)',
  fontSize: '2rem',
  color: '#000000',
  marginBottom: '1rem',
};

const descriptionStyle = {
  fontSize: '0.85rem',
  lineHeight: 1.6,
  color: '#000000',
  marginBottom: '2rem',
};

const loadingReceiptStyle = {
  color: '#000000',
  fontSize: '0.9rem',
  margin: '2rem 0',
  fontStyle: 'italic',
};

const errorReceiptStyle = {
  color: '#000000',
  fontSize: '0.85rem',
  margin: '2rem 0',
  backgroundColor: '#FFFFFF',
  padding: '1rem',
  borderRadius: '4px',
};

const receiptCardStyle = {
  textAlign: 'left',
  border: '1px solid rgba(139, 119, 137, 0.15)',
  backgroundColor: '#FFFFFF', // Soft Cream
  padding: '1.8rem',
  borderRadius: '6px',
  marginBottom: '2rem',
};

const receiptHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.85rem',
  fontWeight: '700',
  color: '#000000',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const orderStatusStyle = {
  color: '#000000',
};

const receiptDividerStyle = {
  height: '1px',
  backgroundColor: 'rgba(139, 119, 137, 0.15)',
  margin: '1rem 0',
};

const itemsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const itemRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const itemInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
};

const itemNameStyle = {
  fontSize: '0.88rem',
  fontWeight: '600',
  color: '#000000',
};

const itemMetaStyle = {
  fontSize: '0.72rem',
  color: '#000000',
};

const itemPriceStyle = {
  fontSize: '0.82rem',
  fontWeight: '700',
  color: '#000000',
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.85rem',
  color: '#000000',
  marginBottom: '0.5rem',
};

const pinkTextStyle = {
  color: '#000000',
  fontWeight: '600',
};

const totalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '1.1rem',
  fontWeight: '700',
  color: '#000000',
};

const shippingDetailsStyle = {
  marginTop: '1.5rem',
  paddingTop: '1rem',
  borderTop: '1px dashed rgba(139, 119, 137, 0.15)',
};

const shipTitleStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#D98E9B',
  display: 'block',
  marginBottom: '0.4rem',
};

const shipAddressStyle = {
  fontSize: '0.8rem',
  lineHeight: 1.5,
  color: '#000000',
};

const actionsContainerStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const btnPrimaryStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.8rem 1.8rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const btnSecondaryStyle = {
  backgroundColor: 'transparent',
  border: '1px solid #000000',
  color: '#000000',
  padding: '0.8rem 1.8rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
