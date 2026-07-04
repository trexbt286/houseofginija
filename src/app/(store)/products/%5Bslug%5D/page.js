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

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) {
          throw new Error('Product not found in our vaults.');
        }
        const data = await res.json();
        setProduct(data.product);
        if (data.product.images && data.product.images.length > 0) {
          setActiveImage(data.product.images[0]);
        }
        
        // Auto select first available size/color combinations if they have stock
        const vars = data.product.variants || [];
        const inStockVar = vars.find(v => v.stock > 0);
        if (inStockVar) {
          setSelectedSize(inStockVar.size || '');
          setSelectedColor(inStockVar.color || '');
        } else if (vars.length > 0) {
          setSelectedSize(vars[0].size || '');
          setSelectedColor(vars[0].color || '');
        }
      } catch (err) {
        setError(err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  if (loading) {
    return <div style={loadingContainerStyle}>Unveiling creation...</div>;
  }

  if (error || !product) {
    return (
      <div style={errorContainerStyle}>
        <h2>Creations Vault Error</h2>
        <p>{error || 'This creation does not exist.'}</p>
        <Link href="/collections" style={backBtnStyle}>
          Back to Collections
        </Link>
      </div>
    );
  }

  // Get available sizes & colors
  const sizes = [...new Set(product.variants.map(v => v.size))].filter(Boolean);
  const colors = [...new Set(product.variants.map(v => v.color))].filter(Boolean);

  // Find stock of selected size/color combination
  const getSelectedVariant = () => {
    return product.variants.find(
      v => v.size === selectedSize && v.color === selectedColor
    );
  };

  const selectedVariant = getSelectedVariant();
  const stockCount = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = product.is_out_of_stock || stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 3;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    
    // Show success feedback
    setCartSuccess(true);
    setTimeout(() => {
      setCartSuccess(false);
    }, 3000);
  };

  const isStarred = wishlist.includes(product.id);
  const cartItem = cart && cart.find(
    item => item.id === product.id && item.size === selectedSize && item.color === selectedColor
  );
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleButtonClick = () => {
    if (isOutOfStock) return;
    if (cartQty > 0) {
      router.push('/cart');
    } else {
      handleAddToCart();
    }
  };

  return (
    <div style={pageStyle} className="container animate-fade-in">
      <div style={breadcrumbsStyle}>
        <Link href="/">Home</Link> &gt;{' '}
        <Link href="/collections">Creations</Link> &gt;{' '}
        <Link href={`/collections?collection=${product.collection_slug}`}>{product.collection_name}</Link> &gt;{' '}
        <span>{product.name}</span>
      </div>

      <div style={productGridStyle}>
        {/* Left Column: Image Gallery */}
        <div style={galleryColumnStyle}>
          <div style={mainImageContainerStyle}>
            <img src={activeImage} alt={product.name} style={mainImageStyle} loading="lazy" />
          </div>
          {product.images && product.images.length > 1 && (
            <div style={thumbnailRowStyle}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  style={activeImage === img ? activeThumbStyle : thumbnailStyle}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx}`} style={thumbImgStyle} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Configuration */}
        <div style={detailsColumnStyle}>
          <span style={collectionNameStyle}>{product.collection_name}</span>
          <h1 style={productNameStyle}>{product.name}</h1>
          <p style={priceStyle}>₹{parseFloat(product.price).toLocaleString('en-IN')}</p>

          <div style={dividerLineStyle}></div>

          <p style={descriptionStyle}>{product.description}</p>

          <div style={dividerLineStyle}></div>

          {/* Variant selections */}
          <div style={selectionContainerStyle}>
            {sizes.length > 0 && (
              <div style={selectionGroupStyle}>
                <span style={selectionLabelStyle}>Select Size:</span>
                <div style={sizeSelectorStyle}>
                  {sizes.map(size => {
                    // Check if size has any stock overall
                    const hasStockInSize = product.variants.some(v => v.size === size && v.stock > 0);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        style={
                          selectedSize === size
                            ? activeSizeBtnStyle
                            : !hasStockInSize
                            ? disabledSizeBtnStyle
                            : sizeBtnStyle
                        }
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div style={selectionGroupStyle}>
                <span style={selectionLabelStyle}>Select Color:</span>
                <div style={colorSelectorStyle}>
                  {colors.map(color => {
                    const hasStockInColor = product.variants.some(v => v.color === color && v.stock > 0);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={
                          selectedColor === color
                            ? activeColorBtnStyle
                            : !hasStockInColor
                            ? disabledColorBtnStyle
                            : colorBtnStyle
                        }
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!(user && user.role === 'admin') && (
              <div style={selectionGroupStyle}>
                <span style={selectionLabelStyle}>Quantity:</span>
                <div style={quantityWrapperStyle}>
                  <button
                    onClick={() => {
                      if (cartQty > 0) {
                        updateCartQuantity(product.id, selectedSize, selectedColor, cartQty - 1);
                      } else {
                        setQuantity(q => Math.max(1, q - 1));
                      }
                    }}
                    style={qtyBtnStyle}
                    disabled={isOutOfStock}
                  >
                    -
                  </button>
                  <span style={qtyValueStyle}>{cartQty > 0 ? cartQty : quantity}</span>
                  <button
                    onClick={() => {
                      if (cartQty > 0) {
                        if (cartQty >= stockCount) return;
                        updateCartQuantity(product.id, selectedSize, selectedColor, cartQty + 1);
                      } else {
                        setQuantity(q => Math.min(stockCount, q + 1));
                      }
                    }}
                    style={qtyBtnStyle}
                    disabled={isOutOfStock || (cartQty > 0 ? cartQty >= stockCount : quantity >= stockCount)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Stock status indicator */}
            <div style={stockStatusContainerStyle}>
              {isOutOfStock ? (
                <span style={outOfStockLabelStyle}>
                  <span style={dotStyle}>●</span> Selection Out of Stock
                </span>
              ) : isLowStock ? (
                <span style={lowStockLabelStyle}>
                  <span style={dotStyle}>●</span> Low Stock: Only {stockCount} left!
                </span>
              ) : (
                <span style={inStockLabelStyle}>
                  <span style={dotStyle}>●</span> In Stock
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {user && user.role === 'admin' ? (
              <div style={actionsContainerStyle}>
                <Link
                  href={`/admin/products?edit=${product.slug}`}
                  style={adminPreviewBtnLinkStyle}
                >
                  Admin Preview: Edit Product
                </Link>
              </div>
            ) : (
              <div style={actionsContainerStyle}>
                <button
                  onClick={handleButtonClick}
                  style={isOutOfStock ? disabledBuyBtnStyle : (cartSuccess || cartQty > 0) ? addedBuyBtnStyle : buyBtnStyle}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? 'Sold Out' : cartSuccess ? '✓ Added to Bag' : cartQty > 0 ? '✓ In Bag — View Bag' : 'Add to Bag'}
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  style={isStarred ? activeWishlistBtnStyle : wishlistBtnStyle}
                  title={isStarred ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={isStarred ? '#D98E9B' : 'none'} stroke={isStarred ? '#D98E9B' : 'currentColor'} strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            )}

            {cartSuccess && (
              <div style={successNotificationStyle} className="animate-fade-in">
                ✨ Timeless creation added to your shopping bag!
              </div>
            )}
          </div>

          <div style={assurancePanelStyle}>
            <div style={assuranceItemStyle}>
              <span style={assuranceIconStyle}>✦</span>
              <div>
                <strong style={assuranceTitleStyle}>Bespoke Tailoring</strong>
                <p style={assuranceDescStyle}>Complimentary pattern adjustments to fit your exact measurements. Contact customer care after checkout.</p>
              </div>
            </div>
            <div style={assuranceItemStyle}>
              <span style={assuranceIconStyle}>✦</span>
              <div>
                <strong style={assuranceTitleStyle}>Free Shipping</strong>
                <p style={assuranceDescStyle}>Complimentary insured door-to-door delivery across India on orders above ₹10,000.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline styles for Product Details Page
const pageStyle = {
  paddingTop: '2.5rem',
  paddingBottom: '6rem',
  backgroundColor: '#FFFFFF',
};

const loadingContainerStyle = {
  textAlign: 'center',
  padding: '10rem 0',
  color: '#000000',
  fontSize: '1.2rem',
  fontFamily: 'var(--font-serif)',
};

const errorContainerStyle = {
  textAlign: 'center',
  padding: '8rem 2rem',
  color: '#000000',
};

const backBtnStyle = {
  display: 'inline-block',
  marginTop: '1.5rem',
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.75rem 2rem',
  borderRadius: '4px',
};

const breadcrumbsStyle = {
  fontSize: '0.8rem',
  color: '#000000',
  marginBottom: '2rem',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
};

const productGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 1fr',
  gap: '4rem',
  alignItems: 'start',
  '@media (max-width: 991px)': {
    gridTemplateColumns: '1fr',
    gap: '2.5rem',
  },
};

const galleryColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const mainImageContainerStyle = {
  position: 'relative',
  width: '100%',
  height: '550px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-md)',
  backgroundColor: '#FFFFFF',
};

const mainImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const heroPinkBadgeStyle = {
  position: 'absolute',
  top: '1.5rem',
  right: '1.5rem',
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.35rem 1rem',
  borderRadius: '999px',
  fontSize: '0.7rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  border: '1px solid #D98E9B',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
};

const thumbnailRowStyle = {
  display: 'flex',
  gap: '0.8rem',
  overflowX: 'auto',
  paddingBottom: '0.5rem',
};

const thumbnailStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '4px',
  overflow: 'hidden',
  border: '2px solid transparent',
  backgroundColor: '#FFFFFF',
  flexShrink: 0,
};

const activeThumbStyle = {
  ...thumbnailStyle,
  bordercolor: '#000000',
};

const thumbImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const detailsColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const collectionNameStyle = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: '#000000',
  fontWeight: '600',
  marginBottom: '0.5rem',
};

const productNameStyle = {
  fontSize: '2.8rem',
  color: '#000000',
  marginBottom: '0.8rem',
  fontFamily: 'var(--font-serif)',
  fontWeight: '400',
  lineHeight: 1.2,
};

const priceStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  color: '#000000',
  marginBottom: '1.5rem',
};

const dividerLineStyle = {
  height: '1px',
  backgroundColor: 'rgba(139, 119, 137, 0.12)',
  margin: '1.5rem 0',
};

const descriptionStyle = {
  fontSize: '0.95rem',
  lineHeight: 1.7,
  color: '#000000',
};

const selectionContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const selectionGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const selectionLabelStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#000000',
  fontWeight: '700',
};

const sizeSelectorStyle = {
  display: 'flex',
  gap: '0.6rem',
  flexWrap: 'wrap',
};

const sizeBtnStyle = {
  border: '1px solid rgba(139, 119, 137, 0.3)',
  backgroundColor: '#D98E9B',
  padding: '0.5rem 1.2rem',
  fontSize: '0.8rem',
  borderRadius: '2px',
  color: '#000000',
};

const activeSizeBtnStyle = {
  ...sizeBtnStyle,
  backgroundColor: '#D98E9B',
  color: '#000000',
  bordercolor: '#000000',
};

const disabledSizeBtnStyle = {
  ...sizeBtnStyle,
  opacity: 0.4,
  textDecoration: 'line-through',
  cursor: 'not-allowed',
};

const colorSelectorStyle = {
  display: 'flex',
  gap: '0.6rem',
  flexWrap: 'wrap',
};

const colorBtnStyle = {
  border: '1px solid rgba(139, 119, 137, 0.3)',
  backgroundColor: '#D98E9B',
  padding: '0.5rem 1.2rem',
  fontSize: '0.8rem',
  borderRadius: '2px',
  color: '#000000',
};

const activeColorBtnStyle = {
  ...colorBtnStyle,
  backgroundColor: '#D98E9B',
  color: '#000000',
  bordercolor: '#000000',
};

const disabledColorBtnStyle = {
  ...colorBtnStyle,
  opacity: 0.4,
  textDecoration: 'line-through',
  cursor: 'not-allowed',
};

const quantityWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid rgba(139, 119, 137, 0.3)',
  width: '120px',
  borderRadius: '4px',
  overflow: 'hidden',
  backgroundColor: '#FFFFFF',
};

const qtyBtnStyle = {
  width: '35px',
  height: '35px',
  fontSize: '1.2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  color: '#000000',
};

const qtyValueStyle = {
  flex: 1,
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: '600',
};

const stockStatusContainerStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
};

const dotStyle = {
  marginRight: '0.3rem',
};

const inStockLabelStyle = {
  color: '#000000', // Green
};

const lowStockLabelStyle = {
  color: '#000000', // Red
};

const outOfStockLabelStyle = {
  color: '#000000', // Gray
};

const actionsContainerStyle = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem',
};

const buyBtnStyle = {
  flex: 1,
  backgroundColor: '#F6DDE2', // Deep Plum
  color: '#000000',
  padding: '1rem 2rem',
  fontSize: '0.85rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  borderRadius: '4px',
  boxShadow: 'var(--shadow-sm)',
  transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
};

const addedBuyBtnStyle = {
  ...buyBtnStyle,
  backgroundColor: '#D98E9B',
  color: '#FFFFFF',
  transform: 'scale(1.02)',
};

const disabledBuyBtnStyle = {
  ...buyBtnStyle,
  backgroundColor: 'rgba(60, 48, 58, 0.15)',
  color: '#000000',
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const adminPreviewBtnStyle = {
  ...buyBtnStyle,
  backgroundColor: 'transparent',
  border: '1px solid #000000',
  color: '#000000',
  cursor: 'default',
  textAlign: 'center',
  boxShadow: 'none',
};

const adminPreviewBtnLinkStyle = {
  ...adminPreviewBtnStyle,
  display: 'block',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const wishlistBtnStyle = {
  width: '52px',
  height: '52px',
  border: '1px solid rgba(139, 119, 137, 0.3)',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#000000',
  backgroundColor: '#D98E9B',
};

const activeWishlistBtnStyle = {
  ...wishlistBtnStyle,
  bordercolor: '#000000',
  color: '#000000',
};

const successNotificationStyle = {
  backgroundColor: '#FFFFFF',
  color: '#000000',
  border: '1px solid #D98E9B',
  padding: '0.8rem 1rem',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: '600',
  textAlign: 'center',
};

const assurancePanelStyle = {
  marginTop: '3.5rem',
  backgroundColor: '#F6DDE2', // Blush Cream background
  padding: '1.8rem',
  borderRadius: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  border: '1px solid rgba(139, 119, 137, 0.12)',
};

const assuranceItemStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'start',
};

const assuranceIconStyle = {
  color: '#000000',
  fontSize: '1.2rem',
  lineHeight: 1,
};

const assuranceTitleStyle = {
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#D98E9B',
  display: 'block',
  marginBottom: '0.2rem',
};

const assuranceDescStyle = {
  fontSize: '0.78rem',
  lineHeight: 1.5,
  color: '#000000',
};
