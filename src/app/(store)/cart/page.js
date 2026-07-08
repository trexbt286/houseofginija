'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, cartSubtotal, updateCartQuantity, removeFromCart } = useStore();
  const router = useRouter();

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');



  // Calculate shipping (free above 10,000, else 250)
  const shippingFee = cartSubtotal >= 10000 || cartSubtotal === 0 ? 0 : 250;

  // Calculate discount
  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return (cartSubtotal * appliedCoupon.discount_value) / 100;
    } else {
      // Flat discount
      return Math.min(cartSubtotal, appliedCoupon.discount_value);
    }
  };

  const discountAmount = getDiscountAmount();
  const cartTotal = cartSubtotal - discountAmount + shippingFee;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput) return;

    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await fetch(`/api/checkout/coupon?code=${couponInput.trim()}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponSuccess(`Promo code "${data.code}" successfully applied!`);
        // Store applied coupon code in session storage for checkout use
        sessionStorage.setItem('ginija_applied_coupon', JSON.stringify(data));
      } else {
        setCouponError(data.error || 'Invalid promo code.');
        setAppliedCoupon(null);
        sessionStorage.removeItem('ginija_applied_coupon');
      }
    } catch (err) {
      console.error(err);
      setCouponError('Error validating promo code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');
    sessionStorage.removeItem('ginija_applied_coupon');
  };

  // Pre-load coupon from storage on mount if it exists
  useEffect(() => {
    const cached = sessionStorage.getItem('ginija_applied_coupon');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAppliedCoupon(parsed);
        setCouponInput(parsed.code);
        setCouponSuccess(`Promo code "${parsed.code}" successfully applied!`);
      } catch (e) {
        sessionStorage.removeItem('ginija_applied_coupon');
      }
    }
  }, []);

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    router.push('/checkout');
  };

  return (
    <div style={pageStyle} className="container animate-fade-in">
      <h1 style={titleStyle}>Your Shopping Bag</h1>
      <div style={dividerStyle}></div>

      {cart.length === 0 ? (
        <div style={emptyCartStyle}>
          <p style={emptyCartTextStyle}>Your shopping bag is currently empty.</p>
          <Link href="/collections" style={shopBtnStyle}>
            Explore Creations
          </Link>
        </div>
      ) : (
        <div style={cartLayoutStyle}>
          {/* Left Column: Cart Items */}
          <div style={itemsColumnStyle}>


            <div style={itemsHeaderStyle}>
              <span>Creation</span>
              <span style={{ textAlign: 'center' }}>Quantity</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>

            {cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${item.color}`} style={itemRowStyle}>
                <div style={itemDetailsStyle}>
                  <img src={item.image} alt={item.name} style={itemImgStyle} loading="lazy" />
                  <div style={itemInfoStyle}>
                    <Link href={`/products/${item.slug}`} style={itemNameStyle}>
                      {item.name}
                    </Link>
                    <span style={itemMetaStyle}>Size: {item.size} | Color: {item.color}</span>
                    <span style={itemUnitPriceStyle}>₹{item.price.toLocaleString('en-IN')} each</span>
                    <button
                      onClick={() => removeFromCart(item.id, item.size, item.color)}
                      style={removeBtnStyle}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div style={qtySelectorStyle}>
                  <button
                    onClick={() => updateCartQuantity(item.id, item.size, item.color, item.quantity - 1)}
                    style={qtyBtnStyle}
                  >
                    -
                  </button>
                  <span style={qtyValueStyle}>{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.id, item.size, item.color, item.quantity + 1)}
                    style={qtyBtnStyle}
                  >
                    +
                  </button>
                </div>

                <div style={itemTotalStyle}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <div style={summaryColumnStyle}>
            <div style={cardStyle}>
              <h3 style={summaryTitleStyle}>Order Summary</h3>
              <div style={summaryDividerStyle}></div>

              {/* Subtotal */}
              <div style={summaryRowStyle}>
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Promo code */}
              <div style={summaryRowStyle}>
                <span>Shipping</span>
                <span>{shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}</span>
              </div>

              {appliedCoupon && (
                <div style={summaryRowStyle}>
                  <span style={discountLabelStyle}>
                    Discount ({appliedCoupon.code})
                    <button onClick={handleRemoveCoupon} style={removeCouponBtnStyle}>
                      [Remove]
                    </button>
                  </span>
                  <span style={discountValueStyle}>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={summaryDividerStyle}></div>

              {/* Final Total */}
              <div style={totalRowStyle}>
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Promo input form */}
              <form onSubmit={handleApplyCoupon} style={couponFormStyle}>
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  style={couponInputStyle}
                  disabled={appliedCoupon}
                />
                {!appliedCoupon ? (
                  <button type="submit" style={couponBtnStyle}>
                    Apply
                  </button>
                ) : (
                  <button type="button" onClick={handleRemoveCoupon} style={couponRemoveBtnStyle}>
                    Clear
                  </button>
                )}
              </form>
              {couponError && <p style={couponErrorStyle}>{couponError}</p>}
              {couponSuccess && <p style={couponSuccessStyle}>{couponSuccess}</p>}

              <button
                onClick={handleProceedToCheckout}
                style={checkoutBtnStyle}
              >
                Proceed to Checkout
              </button>

              <div style={notesPanelStyle}>
                <span style={notesTitleStyle}>Customer Note:</span>
                <p style={notesTextStyle}>We craft our garments slowly. Delivery of our custom silhouettes generally takes 7-10 business days from placement.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles for Cart Page
const pageStyle = {
  paddingTop: '3rem',
  paddingBottom: '6rem',
  backgroundColor: '#FFFFFF',
};

const titleStyle = {
  fontSize: '2.5rem',
  fontFamily: 'var(--font-serif)',
  color: '#D98E9B',
  textAlign: 'center',
  fontWeight: '400',
};

const dividerStyle = {
  width: '60px',
  height: '1px',
  backgroundColor: '#D98E9B',
  margin: '1.2rem auto 2.5rem auto',
};

const emptyCartStyle = {
  textAlign: 'center',
  padding: '6rem 2rem',
};

const emptyCartTextStyle = {
  fontSize: '1.1rem',
  color: '#000000',
  marginBottom: '2rem',
  fontStyle: 'italic',
};

const shopBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.8rem 2.2rem',
  borderRadius: '999px',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontWeight: '600',
};

const cartLayoutStyle = {
  display: 'grid',
  gridTemplateColumns: '1.8fr 1fr',
  gap: '3.5rem',
  alignItems: 'start',
  '@media (max-width: 991px)': {
    gridTemplateColumns: '1fr',
    gap: '2.5rem',
  },
};

const itemsColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const giftBannerStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D98E9B',
  padding: '1.2rem',
  borderRadius: '6px',
  display: 'flex',
  gap: '1rem',
  alignItems: 'start',
};

const giftIconStyle = {
  fontSize: '1.3rem',
  color: '#000000',
};

const giftTitleStyle = {
  fontSize: '0.85rem',
  color: '#D98E9B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const giftDescStyle = {
  fontSize: '0.78rem',
  color: '#000000',
  marginTop: '0.2rem',
};

const itemsHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  paddingBottom: '0.8rem',
  borderBottom: '1px solid rgba(139, 119, 137, 0.15)',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#000000',
  fontWeight: '700',
};

const itemRowStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  alignItems: 'center',
  padding: '1.5rem 0',
  borderBottom: '1px solid rgba(139, 119, 137, 0.1)',
};

const itemDetailsStyle = {
  display: 'flex',
  gap: '1.2rem',
};

const itemImgStyle = {
  width: '90px',
  height: '110px',
  objectFit: 'cover',
  borderRadius: '4px',
  backgroundColor: '#FFFFFF',
};

const itemInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const itemNameStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.15rem',
  color: '#000000',
  fontWeight: '500',
};

const itemMetaStyle = {
  fontSize: '0.75rem',
  color: '#000000',
};

const itemUnitPriceStyle = {
  fontSize: '0.8rem',
  color: '#000000',
};

const removeBtnStyle = {
  fontSize: '0.75rem',
  color: '#000000',
  alignSelf: 'flex-start',
  marginTop: '0.5rem',
  textDecoration: 'underline',
  cursor: 'pointer',
};

const qtySelectorStyle = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  borderRadius: '4px',
  overflow: 'hidden',
  width: '100px',
  justifySelf: 'center',
  backgroundColor: '#FFFFFF',
};

const qtyBtnStyle = {
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  color: '#000000',
};

const qtyValueStyle = {
  flex: 1,
  textAlign: 'center',
  fontSize: '0.85rem',
  fontWeight: '600',
};

const itemTotalStyle = {
  textAlign: 'right',
  fontSize: '1rem',
  fontWeight: '600',
  color: '#000000',
};

const summaryColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const cardStyle = {
  backgroundColor: '#F6DDE2', // Blush Cream background
  borderRadius: '8px',
  padding: '2rem',
  border: '1px solid rgba(139, 119, 137, 0.15)',
};

const summaryTitleStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#D98E9B',
  fontWeight: '700',
};

const summaryDividerStyle = {
  height: '1px',
  backgroundColor: 'rgba(139, 119, 137, 0.15)',
  margin: '1.2rem 0',
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.9rem',
  color: '#000000',
  marginBottom: '0.8rem',
};

const discountLabelStyle = {
  color: '#000000',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const removeCouponBtnStyle = {
  color: '#000000',
  fontSize: '0.7rem',
  textDecoration: 'underline',
};

const discountValueStyle = {
  color: '#000000',
  fontWeight: '600',
};

const totalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '1.2rem',
  fontWeight: '700',
  color: '#000000',
  marginBottom: '1.5rem',
};

const couponFormStyle = {
  display: 'flex',
  gap: '0.4rem',
  marginBottom: '0.5rem',
};

const couponInputStyle = {
  padding: '0.5rem 0.8rem',
  fontSize: '0.85rem',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  flex: 1,
};

const couponBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.5rem 1.2rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  borderRadius: '4px',
};

const couponRemoveBtnStyle = {
  ...couponBtnStyle,
  backgroundColor: '#D98E9B',
};

const couponErrorStyle = {
  color: '#000000',
  fontSize: '0.78rem',
  marginBottom: '1rem',
};

const couponSuccessStyle = {
  color: '#000000',
  fontSize: '0.78rem',
  marginBottom: '1rem',
};

const checkoutBtnStyle = {
  width: '100%',
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '1rem',
  fontSize: '0.85rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  borderRadius: '4px',
  marginTop: '1rem',
  boxShadow: 'var(--shadow-sm)',
};

const notesPanelStyle = {
  marginTop: '1.5rem',
  borderTop: '1px dashed rgba(139, 119, 137, 0.2)',
  paddingTop: '1rem',
};

const notesTitleStyle = {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#D98E9B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: '0.2rem',
};

const notesTextStyle = {
  fontSize: '0.72rem',
  color: '#000000',
  lineHeight: 1.4,
};
