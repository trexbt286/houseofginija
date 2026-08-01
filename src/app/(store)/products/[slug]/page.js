'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';

export default function ProductPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, cart, addToCart, updateCartQuantity, wishlist, toggleWishlist } = useStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error('Product not found in our vaults.');

        const data = await res.json();
        const nextProduct = data.product;
        setProduct(nextProduct);
        setActiveImage(nextProduct.images?.[0] || '');

        const vars = nextProduct.variants || [];
        const inStockVar = vars.find(v => v.stock > 0);
        const firstVariant = inStockVar || vars[0];
        if (firstVariant) {
          setSelectedSize(firstVariant.size || '');
          setSelectedColor(firstVariant.color || '');
        }
      } catch (err) {
        setError(err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  if (loading) return <div style={loadingContainerStyle}>Unveiling creation...</div>;

  if (error || !product) {
    return (
      <div style={errorContainerStyle}>
        <h2>Creations Vault Error</h2>
        <p>{error || 'This creation does not exist.'}</p>
        <Link href="/collections" style={backBtnStyle}>Back to Collections</Link>
      </div>
    );
  }

  const variants = product.variants || [];
  const hasClothingSizes = variants.some(v => ['S', 'M', 'L', 'XL', 'XXL'].includes(v.size?.toUpperCase()));
  const sizes = hasClothingSizes ? ['S', 'M', 'L', 'XL', 'XXL'] : [...new Set(variants.map(v => v.size))].filter(Boolean);
  const selectedVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
  const stockCount = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = product.is_out_of_stock || stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 3;
  const isStarred = wishlist.includes(product.id);
  const cartItem = cart && cart.find(item => item.id === product.id && item.size === selectedSize && item.color === selectedColor);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const formattedPrice = parseFloat(product.price).toLocaleString('en-IN');

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 3000);
  };

  const handleButtonClick = () => {
    if (isOutOfStock) return;
    if (cartQty > 0) router.push('/cart');
    else handleAddToCart();
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Explore ${product.name} at House of Ginija`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard?.writeText(window.location.href);
    } catch {
      // Sharing can be cancelled by the user; no visible fallback is needed.
    }
  };

  const primaryActionLabel = isOutOfStock
    ? 'Sold Out'
    : cartQty > 0
    ? `${cartQty} in Bag`
    : cartSuccess
    ? 'Added to Bag'
    : 'Add to Bag';

  return (
    <main style={pageStyle} className="product-luxury-page animate-fade-in">
      <section style={heroSectionStyle} className="product-luxury-hero">
        <div style={imageStageStyle} className="product-luxury-image-stage">
          <img
            src={activeImage}
            alt={product.name}
            style={mainImageStyle}
            className="product-luxury-image"
            loading="eager"
            fetchPriority="high"
          />

          <button type="button" onClick={() => router.back()} style={floatingButtonStyle} className="product-floating-button product-floating-back" aria-label="Go back">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>

          <div style={floatingActionsStyle} className="product-floating-actions">
            <button type="button" onClick={() => toggleWishlist(product.id)} style={floatingButtonStyle} className="product-floating-button" aria-label={isStarred ? 'Remove from wishlist' : 'Add to wishlist'}>
              <svg width="25" height="25" viewBox="0 0 24 24" fill={isStarred ? '#000000' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </button>
            <button type="button" onClick={handleShare} style={floatingButtonStyle} className="product-floating-button" aria-label="Share product">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v14" /></svg>
            </button>
          </div>

          {product.images && product.images.length > 1 && (
            <div style={imageDotsStyle} className="product-image-dots" aria-label="Product images">
              {product.images.map((img, idx) => (
                <button key={idx} type="button" onClick={() => setActiveImage(img)} style={activeImage === img ? activeDotStyle : dotButtonStyle} aria-label={`Show product image ${idx + 1}`} />
              ))}
            </div>
          )}
        </div>

        <div style={detailsPanelStyle} className="product-luxury-details">
          <Link href={`/collections?collection=${product.collection_slug}`} style={collectionNameStyle}>{product.collection_name}</Link>
          <h1 style={productNameStyle}>{product.name}</h1>
          <p style={priceStyle}>&#8377;{formattedPrice}</p>
          <p style={descriptionStyle}>{product.description}</p>

          <div style={stockNoteStyle}>
            {isOutOfStock ? <span>Selection out of stock</span> : isLowStock ? <span>Only {stockCount} left</span> : <span>Remaining stock: {stockCount} available</span>}
          </div>

          {sizes.length > 0 && (
            <div style={selectionGroupStyle}>
              <span style={selectionLabelStyle}>Select Size</span>
              <div style={sizeSelectorStyle}>
                {sizes.map(size => {
                  const variantForSize = variants.find(v => (v.size || '').toUpperCase() === size.toUpperCase());
                  const hasStockInSize = variantForSize && variantForSize.stock > 0;
                  const isSelected = selectedSize === size;
                  return (
                    <button key={size} type="button" disabled={!hasStockInSize} onClick={() => setSelectedSize(size)} style={isSelected ? activeSizeBtnStyle : !hasStockInSize ? disabledSizeBtnStyle : sizeBtnStyle}>{size}</button>
                  );
                })}
              </div>
            </div>
          )}

          {!(user && user.role === 'admin') && cartQty === 0 && (
            <div style={selectionGroupStyle}>
              <span style={selectionLabelStyle}>Quantity</span>
              <div style={quantityWrapperStyle}>
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={qtyBtnStyle} disabled={isOutOfStock} aria-label="Decrease quantity">-</button>
                <span style={qtyValueStyle}>{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => Math.min(stockCount, q + 1))} style={qtyBtnStyle} disabled={isOutOfStock || quantity >= stockCount} aria-label="Increase quantity">+</button>
              </div>
            </div>
          )}

          <div style={assuranceStripStyle} className="product-assurance-strip">
            <div style={assuranceItemStyle}><QualityIcon /><span>Premium Quality</span></div>
            <div style={assuranceItemStyle}><MeasureIcon /><span>Tailored Fit</span></div>
            <div style={assuranceItemStyle}><ReturnsIcon /><span>Easy Returns</span></div>
            <div style={assuranceItemStyle}><SecureIcon /><span>Secure Payment</span></div>
          </div>

          {user && user.role === 'admin' ? (
            <Link href={`/admin/products?edit=${product.slug}`} style={adminPreviewBtnLinkStyle}>Admin Preview: Edit Product</Link>
          ) : (
            <div style={desktopActionsStyle} className="product-desktop-actions">
              {cartQty > 0 ? (
                <div className="blinkit-count-controller" style={cartCounterStyle}>
                  <button type="button" style={cartCounterButtonStyle} onClick={() => updateCartQuantity(product.id, selectedSize, selectedColor, cartQty - 1)}>-</button>
                  <span style={cartCounterTextStyle}>{cartQty} in Bag</span>
                  <button type="button" style={{ ...cartCounterButtonStyle, opacity: cartQty >= stockCount ? 0.35 : 1 }} disabled={cartQty >= stockCount} onClick={() => updateCartQuantity(product.id, selectedSize, selectedColor, cartQty + 1)}>+</button>
                </div>
              ) : (
                <button type="button" onClick={handleButtonClick} style={isOutOfStock ? disabledBuyBtnStyle : cartSuccess ? addedBuyBtnStyle : buyBtnStyle} disabled={isOutOfStock}>{primaryActionLabel}</button>
              )}
            </div>
          )}

          {cartSuccess && <div style={successNotificationStyle} className="animate-fade-in">Timeless creation added to your shopping bag.</div>}
        </div>
      </section>

      <section style={reviewsWrapStyle} className="product-reviews-wrap">
        <ReviewsAccordion product={product} reviewsOpen={reviewsOpen} setReviewsOpen={setReviewsOpen} />
      </section>

      {!(user && user.role === 'admin') && (
        <div style={stickyBarStyle} className="product-sticky-bar">
          {cartQty > 0 ? (
            <div className="blinkit-count-controller" style={stickyCounterStyle}>
              <button type="button" style={stickyCounterButtonStyle} onClick={() => updateCartQuantity(product.id, selectedSize, selectedColor, cartQty - 1)}>-</button>
              <span>{cartQty} in Bag</span>
              <button type="button" style={{ ...stickyCounterButtonStyle, opacity: cartQty >= stockCount ? 0.35 : 1 }} disabled={cartQty >= stockCount} onClick={() => updateCartQuantity(product.id, selectedSize, selectedColor, cartQty + 1)}>+</button>
            </div>
          ) : (
            <button type="button" onClick={handleButtonClick} style={isOutOfStock ? stickyDisabledButtonStyle : stickyBuyButtonStyle} disabled={isOutOfStock}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
              {primaryActionLabel}
            </button>
          )}
        </div>
      )}
    </main>
  );
}


function QualityIcon() {
  return <svg style={assuranceIconStyle} width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 15l-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 3z" /></svg>;
}

function MeasureIcon() {
  return <svg style={assuranceIconStyle} width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 15l5-5 11 11H4v-6z" /><path d="M8 16h1" /><path d="M11 16h1" /><path d="M14 16h1" /></svg>;
}

function ReturnsIcon() {
  return <svg style={assuranceIconStyle} width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12a8 8 0 0 1 13.7-5.7" /><path d="M18 3v5h-5" /><path d="M20 12a8 8 0 0 1-13.7 5.7" /><path d="M6 21v-5h5" /></svg>;
}

function SecureIcon() {
  return <svg style={assuranceIconStyle} width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>;
}
function ReviewsAccordion({ product, reviewsOpen, setReviewsOpen }) {
  const reviewsList = getProductReviews(product);
  return (
    <div style={reviewsContainerStyle}>
      <button type="button" onClick={() => setReviewsOpen(!reviewsOpen)} style={reviewsButtonStyle}>
        <span style={reviewsTitleStyle}>Client Reviews ({reviewsList.length})</span>
        <span style={reviewsToggleStyle}>{reviewsOpen ? '-' : '+'}</span>
      </button>
      {reviewsOpen && (
        <div style={reviewsListStyle} className="animate-fade-in">
          {reviewsList.map((rev, idx) => (
            <div key={idx} style={idx < reviewsList.length - 1 ? reviewItemBorderStyle : reviewItemStyle}>
              <div style={reviewHeaderStyle}><strong style={reviewAuthorStyle}>{rev.author}</strong><span style={reviewDateStyle}>{rev.date}</span></div>
              <div style={reviewStarsStyle}>{'*'.repeat(rev.stars)}{'*'.repeat(5 - rev.stars)}</div>
              <p style={reviewTextStyle}>"{rev.content}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getProductReviews(product) {
  if (product.collection_slug === 'suits' || product.name.toLowerCase().includes('suit')) {
    return [
      { author: 'Aria S. (Mumbai)', date: 'May 2026', stars: 5, content: 'The custom fit is absolutely exquisite. The fabric weights and silk linings feel incredibly premium against the skin. Will definitely order custom measurements again.' },
      { author: 'Meera K. (New Delhi)', date: 'June 2026', stars: 5, content: 'Flawless tailoring. Every seam is finished to perfection. It is rare to find this level of slow-fashion artisan craftsmanship today.' }
    ];
  }
  return [
    { author: 'Priya R. (Bengaluru)', date: 'April 2026', stars: 5, content: 'A stunning heirloom piece. The gold luster and weight feel substantial and luxury. The design strikes a perfect balance between modern and traditional.' },
    { author: 'Kiran D. (Hyderabad)', date: 'June 2026', stars: 5, content: 'Beautifully packaged and absolute master craftsmanship. The detail under a magnifying loop shows how precise the artisan setting is.' }
  ];
}

const pageStyle = { backgroundColor: '#FFFFFF', minHeight: '100vh', paddingBottom: '8rem' };
const loadingContainerStyle = { textAlign: 'center', padding: '10rem 0', color: '#000000', fontSize: '1.2rem', fontFamily: 'var(--font-serif)' };
const errorContainerStyle = { textAlign: 'center', padding: '8rem 2rem', color: '#000000' };
const backBtnStyle = { display: 'inline-block', marginTop: '1.5rem', backgroundColor: '#D98E9B', color: '#000000', padding: '0.75rem 2rem', borderRadius: '4px' };
const heroSectionStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(390px, 0.72fr)', alignItems: 'stretch', width: '100%', minHeight: 'calc(100vh - 108px)', backgroundColor: '#FFFFFF' };
const imageStageStyle = { position: 'relative', minHeight: 'calc(100vh - 108px)', backgroundColor: '#F7F1EF', overflow: 'hidden' };
const mainImageStyle = { width: '100%', height: '100%', display: 'block', objectFit: 'contain', objectPosition: 'center' };
const floatingButtonStyle = { width: '58px', height: '58px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.94)', color: '#000000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)', backdropFilter: 'blur(10px)' };
const floatingActionsStyle = { position: 'absolute', top: 'clamp(1rem, 4vw, 2.5rem)', right: 'clamp(1rem, 4vw, 2.5rem)', display: 'flex', gap: '1rem', zIndex: 2 };
const imageDotsStyle = { position: 'absolute', left: '50%', bottom: 'clamp(1.25rem, 4vw, 2.5rem)', transform: 'translateX(-50%)', display: 'flex', gap: '0.55rem', zIndex: 2 };
const dotButtonStyle = { width: '11px', height: '11px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(0, 0, 0, 0.12)' };
const activeDotStyle = { ...dotButtonStyle, backgroundColor: '#FFFFFF', transform: 'scale(1.18)' };
const detailsPanelStyle = { alignSelf: 'end', backgroundColor: '#FFFFFF', padding: 'clamp(2rem, 4vw, 4rem)', borderTopLeftRadius: '34px', boxShadow: '-22px 0 45px rgba(0, 0, 0, 0.06)', display: 'flex', flexDirection: 'column', gap: '1.25rem' };
const collectionNameStyle = { fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D98E9B', fontWeight: '800' };
const productNameStyle = { fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.8rem, 5vw, 4.6rem)', fontWeight: '400', lineHeight: 1, color: '#000000' };
const priceStyle = { fontSize: 'clamp(1.8rem, 3vw, 2.55rem)', fontWeight: '800', color: '#000000', lineHeight: 1.1 };
const descriptionStyle = { fontSize: '1rem', lineHeight: 1.7, color: 'rgba(0, 0, 0, 0.68)' };
const stockNoteStyle = { color: '#B8860B', fontSize: '0.95rem', fontWeight: '600' };
const selectionGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.35rem' };
const selectionLabelStyle = { fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#D98E9B', fontWeight: '800' };
const sizeSelectorStyle = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' };
const sizeBtnStyle = { minWidth: '62px', height: '48px', border: '1px solid rgba(0, 0, 0, 0.14)', backgroundColor: '#FFFFFF', fontSize: '1rem', borderRadius: '999px', color: '#000000', fontWeight: '800', boxShadow: '0 5px 16px rgba(0, 0, 0, 0.04)' };
const activeSizeBtnStyle = { ...sizeBtnStyle, backgroundColor: '#000000', color: '#FFFFFF', borderColor: '#000000' };
const disabledSizeBtnStyle = { ...sizeBtnStyle, opacity: 0.35, textDecoration: 'line-through', cursor: 'not-allowed', backgroundColor: '#F8F8F8', color: '#777777' };
const quantityWrapperStyle = { display: 'flex', alignItems: 'center', border: '1px solid rgba(0, 0, 0, 0.12)', width: '138px', height: '46px', borderRadius: '999px', overflow: 'hidden', backgroundColor: '#FFFFFF' };
const qtyBtnStyle = { width: '42px', height: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000' };
const qtyValueStyle = { flex: 1, textAlign: 'center', fontSize: '0.95rem', fontWeight: '700' };
const assuranceStripStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', borderTop: '1px solid rgba(0, 0, 0, 0.08)', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', padding: '1.25rem 0', marginTop: '0.35rem' };
const assuranceItemStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', textAlign: 'center', color: '#000000', fontSize: '0.78rem' };
const assuranceIconStyle = { color: '#D98E9B', fontSize: '1.35rem', lineHeight: 1 };
const desktopActionsStyle = { display: 'flex', marginTop: '0.6rem' };
const buyBtnStyle = { width: '100%', minHeight: '58px', backgroundColor: '#D98E9B', color: '#FFFFFF', padding: '1rem 2rem', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', borderRadius: '999px', boxShadow: '0 16px 28px rgba(217, 142, 155, 0.32)' };
const addedBuyBtnStyle = { ...buyBtnStyle, backgroundColor: '#000000' };
const disabledBuyBtnStyle = { ...buyBtnStyle, backgroundColor: 'rgba(60, 48, 58, 0.18)', color: '#000000', cursor: 'not-allowed', boxShadow: 'none' };
const adminPreviewBtnLinkStyle = { ...buyBtnStyle, display: 'block', textAlign: 'center', textDecoration: 'none', backgroundColor: '#FFFFFF', color: '#000000', border: '1px solid #000000', boxShadow: 'none' };
const cartCounterStyle = { ...buyBtnStyle, backgroundColor: '#FFFFFF', border: '1px solid #D98E9B', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', boxShadow: 'none' };
const cartCounterButtonStyle = { color: '#D98E9B', fontSize: '1.45rem', fontWeight: '800', padding: '0 0.8rem' };
const cartCounterTextStyle = { color: '#000000', fontSize: '0.95rem', fontWeight: '800' };
const successNotificationStyle = { backgroundColor: '#FFFFFF', color: '#000000', border: '1px solid #D98E9B', padding: '0.85rem 1rem', borderRadius: '999px', fontSize: '0.86rem', fontWeight: '700', textAlign: 'center' };
const reviewsWrapStyle = { maxWidth: '920px', margin: '3rem auto 0', padding: '0 2rem' };
const reviewsContainerStyle = { borderTop: '1px solid #ECECEC', borderBottom: '1px solid #ECECEC' };
const reviewsButtonStyle = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0.5rem', backgroundColor: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', textAlign: 'left' };
const reviewsTitleStyle = { fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.08em' };
const reviewsToggleStyle = { fontSize: '1.2rem', color: '#000000' };
const reviewsListStyle = { padding: '0.5rem 0.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' };
const reviewItemStyle = { paddingBottom: '1.2rem' };
const reviewItemBorderStyle = { ...reviewItemStyle, borderBottom: '1px dashed #F3F3F3' };
const reviewHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' };
const reviewAuthorStyle = { fontSize: '0.88rem', color: '#000000' };
const reviewDateStyle = { fontSize: '0.75rem', color: 'rgba(0,0,0,0.4)' };
const reviewStarsStyle = { display: 'flex', gap: '0.2rem', marginBottom: '0.5rem', color: '#B8860B', fontSize: '0.85rem' };
const reviewTextStyle = { fontSize: '0.82rem', color: 'rgba(0,0,0,0.7)', lineHeight: 1.5, fontStyle: 'italic', margin: 0 };
const stickyBarStyle = { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 80, backgroundColor: 'rgba(255, 255, 255, 0.96)', borderTop: '1px solid rgba(0, 0, 0, 0.08)', padding: '0.9rem 1rem calc(0.9rem + env(safe-area-inset-bottom))', backdropFilter: 'blur(16px)', display: 'flex' };
const stickyBuyButtonStyle = { ...buyBtnStyle, minHeight: '56px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' };
const stickyDisabledButtonStyle = { ...stickyBuyButtonStyle, backgroundColor: 'rgba(60, 48, 58, 0.18)', color: '#000000', cursor: 'not-allowed', boxShadow: 'none' };
const stickyCounterStyle = { ...cartCounterStyle, minHeight: '56px' };
const stickyCounterButtonStyle = { color: '#D98E9B', fontSize: '1.5rem', fontWeight: '800', padding: '0 1rem' };
