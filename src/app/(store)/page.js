'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { useEffect, useState } from 'react';

export default function Home() {
  const { triggerSparkleConfetti } = useStore();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  const reviewImages = [
    {
      img: '/reviews/review_1.jpg',
      name: 'Saurabh Singh',
      location: 'Lucknow',
      initial: 'S',
      text: 'I have been visiting the House of Ginija since last two years and all the ladies in my family absolutely adore the collection of the studio. The professional yet personal touch provided by Nikita to all the handcrafted pieces is what makes it one of the leading brand of chique fashion in the city.',
    },
    {
      img: '/reviews/review_2.jpg',
      name: 'Chaitra Reddy',
      location: 'United States',
      initial: 'C',
      text: 'The store was recommended to me by a friend, absolutely lovely collection. Recently I placed an order ( which I am going to ship to the United States later ) and I want to appreciate all the patience and responsiveness even with the time difference. Amazing collection and service.',
    },
    {
      img: '/reviews/review_3.jpg',
      name: 'Riya Sen',
      location: 'Delhi',
      initial: 'R',
      text: 'Heyy! I loved your lehanga so much ... it was too good 😊 I was looking so pretty in the lehanga ... looking to buy more dresses from you ... Will share the pics soon !!! ❤️',
    },
    {
      img: '/reviews/review_4.jpg',
      name: 'Krati Parmar',
      location: 'Lucknow',
      initial: 'K',
      text: "I have been visiting House of Ginija since their launch in Lucknow and I just can't stop coming back. Nikita, the owner is super hospitable and the staff provides the best support and service. Their every season collection is to die for😍 Best brand label in Lucknow!! Highly recommended",
    },
    {
      img: '/reviews/review_5.jpg',
      name: 'Priya Sharma',
      location: 'Mumbai',
      initial: 'P',
      text: 'Hey thanks for the beautiful suit ❤️ it\'s really very gorgeous. My husband too loved it 🥰🥰 Looking forward to purchase many more outfits from your collection in coming festive season. Simply superb & classy 😍 Thank you once again!',
    },
    {
      img: '/reviews/review_1.jpg',
      name: 'Anjali Verma',
      location: 'Lucknow',
      initial: 'A',
      text: 'Superb quality and absolute master craftsmanship! The suit fits like a dream and the fabric is incredibly premium. Nikita was very responsive and guided me on sizing options. Definitely buying more soon.',
    },
    {
      img: '/reviews/review_2.jpg',
      name: 'Divya Nair',
      location: 'Bangalore',
      initial: 'D',
      text: 'Outstanding experience shopping here. The designs are exclusive and unique, and the fit is absolute perfection. Highly recommend their bespoke tailoring service for special occasions.',
    },
    {
      img: '/reviews/review_4.jpg',
      name: 'Meenakshi Iyer',
      location: 'Chennai',
      initial: 'M',
      text: 'House of Ginija has become my absolute favorite label. The attention to detail, fine embroidery, and overall customer service is unparalleled. A stellar brand for high-end couture.',
    },
  ];

  useEffect(() => {
    // Sparkle confetti effect on page load for delightful experience
    setTimeout(() => {
      triggerSparkleConfetti();
    }, 1200);

    // Fetch collections from db via API
    const fetchCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div style={pageContainerStyle}>
      {/* 1. HERO SECTION */}
      <section style={heroSectionStyle}>
        <video
          src="/VID_20260702_111900_407_bsl~2.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
        <div style={heroOverlayStyle}>
          <div style={heroContentStyle} className="animate-fade-in hero-content-wrapper">
            <h1 style={heroTitleStyle}>
              House Of <br className="mobile-only-br" />
              Ginija
            </h1>
            <p className="brand-tagline" style={{ ...heroTaglineStyle, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#B8860B', marginRight: '0.6rem', fontWeight: '400' }}>—</span>
              <span style={{ fontStyle: 'italic', color: '#D98E9B' }}>The Designer Label</span>
              <span style={{ color: '#B8860B', marginLeft: '0.6rem', fontWeight: '400' }}>—</span>
            </p>

            <div style={heroActionsStyle}>
              <Link href="/collections" style={heroBtnPinkStyle} className="hero-btn-pink">
                Explore Creations &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Value Props Bar */}
        <div className="hero-value-props-bar">
          <div className="value-prop-item">
            {/* Handloom Weaving Shuttle Icon */}
            <svg className="value-prop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12l4-3h12l4 3-4 3H6l-4-3z" />
              <path d="M9 10h6v4H9z" />
              <line x1="12" y1="10" x2="12" y2="14" />
              <path d="M4 12c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" opacity="0.25" />
            </svg>
            <div className="value-prop-text">
              <span>Premium</span>
              <span>Quality</span>
            </div>
          </div>
          <div className="value-prop-divider"></div>
          <div className="value-prop-item">
            {/* Yarn Spool / Hand-spun Wool Icon */}
            <svg className="value-prop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="7" />
              <path d="M7 10c2.5-1 7.5-1 10 0" />
              <path d="M6 13c3 .5 9 .5 12 0" />
              <path d="M8 16c2.5 1 5.5 1 8 0" />
              <line x1="3" y1="21" x2="21" y2="3" />
              <circle cx="21" cy="3" r="1.2" fill="currentColor" />
            </svg>
            <div className="value-prop-text">
              <span>Slow</span>
              <span>Fashion</span>
            </div>
          </div>
          <div className="value-prop-divider"></div>
          <div className="value-prop-item">
            {/* Sewing Needle & Thread Loop Icon */}
            <svg className="value-prop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="20" x2="18" y2="6" />
              <ellipse cx="16.5" cy="7.5" rx="1.8" ry="0.9" transform="rotate(-45 16.5 7.5)" />
              <path d="M18 6c3.5-3.5 5.5-1 2 2.5s-6 5-9.5 5-5.5-2-7.5 0" />
            </svg>
            <div className="value-prop-text">
              <span>Expert</span>
              <span>Tailoring</span>
            </div>
          </div>
          <div className="value-prop-divider"></div>
          <div className="value-prop-item">
            {/* Tailor's Tape Measure Infinity Loop Icon */}
            <svg className="value-prop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10c0-4 4-6 8-6s8 2 8 6-4 8-8 10-8-4-8-10z" />
              <line x1="8" y1="4.2" x2="8" y2="6.2" />
              <line x1="12" y1="4" x2="12" y2="7" />
              <line x1="16" y1="4.2" x2="16" y2="6.2" />
              <line x1="18.5" y1="7.2" x2="16.8" y2="8.2" />
              <line x1="19.5" y1="11" x2="17.5" y2="11.5" />
              <line x1="11.5" y1="16.5" x2="13.2" y2="17.8" />
            </svg>
            <div className="value-prop-text">
              <span>Made To</span>
              <span>Last</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED COLLECTIONS SECTION */}
      <section style={collectionsSectionStyle}>
        <div className="container">
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Signature Collections</h2>
            <div style={sectionDividerLineStyle}></div>
          </div>

          {loading ? (
            <div style={loadingWrapperStyle}>Loading collections...</div>
          ) : (
            <div style={collectionsGridStyle} className="collections-grid">
              {collections.map((col) => {
                return (
                  <Link 
                    href={`/collections?collection=${col.slug}`} 
                    key={col.id} 
                    style={collectionCardStyle}
                    className="collections-grid-card"
                  >
                    <div style={cardImageWrapperStyle}>
                      <Image 
                        src={col.image_url} 
                        alt={col.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                        loading="lazy" 
                      />
                    </div>
                    <div style={cardContentStyle} className="collections-grid-card-content">
                      <h3 style={cardTitleStyle}>
                        {col.name}
                      </h3>
                      <p style={cardDescStyle}>{col.description}</p>
                      <span style={cardLinkStyle}>
                        View Collection →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Separator Line */}
      <div style={{ height: '1px', backgroundColor: 'rgba(139, 119, 137, 0.15)', width: '100%' }}></div>

      {/* 4. CLIENT REVIEWS SECTION */}
      <section style={reviewsSectionStyle}>
        <div className="container">
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Reviews</h2>
            <div style={sectionDividerLineStyle}></div>
          </div>
        </div>

        <div className="reviews-ticker-container">
          <div className="reviews-ticker-wrapper">
            {/* Duplicate array mapping to support seamless loop auto scroll ticker */}
            {[...reviewImages, ...reviewImages].map((rev, idx) => (
              <div 
                key={idx} 
                className="review-card"
                onClick={() => setSelectedReview(rev.img)}
              >
                <div className="review-card-header">
                  <span className="review-stars">★★★★★</span>
                  <span className="review-quote-icon">”</span>
                </div>
                <p className="review-card-text">
                  "{rev.text}"
                </p>
                <div className="review-card-footer">
                  <div className="review-avatar">{rev.initial}</div>
                  <div className="review-client-info">
                    <span className="review-client-name">{rev.name}</span>
                    <span className="review-client-location">{rev.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedReview && (
        <div 
          style={lightboxOverlayStyle} 
          onClick={() => setSelectedReview(null)}
        >
          <div style={lightboxContentStyle} onClick={(e) => e.stopPropagation()}>
            <button 
              style={lightboxCloseBtnStyle} 
              onClick={() => setSelectedReview(null)}
            >
              ✕
            </button>
            <img 
              src={selectedReview} 
              alt="Client appreciation full" 
              style={lightboxImgStyle} 
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Floating WhatsApp Chat Button */}
      <a 
        href="https://wa.me/917080806053" 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-floating-btn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.407 0 9.811-4.38 9.813-9.75.002-2.602-1.01-5.05-2.85-6.895-1.84-1.847-4.292-2.865-6.894-2.866-5.417 0-9.821 4.382-9.825 9.75-.002 2.115.556 4.177 1.621 5.995L1.898 21.6l4.75-1.246zm11.23-5.385c-.298-.148-1.758-.865-2.03-.966-.273-.101-.471-.148-.67.149-.197.297-.768.966-.94 1.164-.173.199-.347.223-.646.074-.299-.148-1.261-.464-2.399-1.48-1.272-1.134-1.83-2.15-2.079-2.547-.248-.396-.026-.61.173-.808.18-.178.397-.462.596-.693.199-.23.265-.396.398-.66.133-.264.066-.495-.033-.693-.1-.198-.865-2.08-1.186-2.85-.314-.755-.632-.653-.865-.653H7.49c-.23 0-.604.088-.92.43-.318.344-1.211 1.187-1.211 2.895 0 1.708 1.244 3.359 1.417 3.59.172.23 2.45 3.738 5.93 5.24 2.443 1.054 3.528 1.157 4.79.97 1.137-.168 2.76-.84 3.153-1.652.393-.813.393-1.509.276-1.656-.118-.149-.438-.236-.736-.384z"/>
        </svg>
        <span>Chat With Us</span>
      </a>
    </div>
  );
}

// Inline styles for Homepage
const pageContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
};

const heroSectionStyle = {
  height: 'calc(100vh - 107px)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const heroOverlayStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 2rem',
  background: 'linear-gradient(135deg, rgba(28, 22, 28, 0.45) 0%, rgba(28, 22, 28, 0.7) 100%)',
  position: 'relative',
  zIndex: 1,
};

const heroContentStyle = {
  maxWidth: '750px',
  textAlign: 'center',
  color: '#FFFFFF',
};

const heroBadgeStyle = {
  border: '1px solid #D98E9B',
  color: '#FFFFFF',
  padding: '0.4rem 1.2rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  display: 'inline-block',
  marginBottom: '1.5rem',
};

const heroTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '4.2rem',
  fontWeight: '400',
  color: '#FFFFFF',
  marginBottom: '0.5rem',
  letterSpacing: '0.05em',
  textShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
};

const heroTaglineStyle = {
  fontSize: '3.2rem',
  color: '#D98E9B',
  marginBottom: '1.5rem',
  textShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  fontWeight: '400',
};

const heroDescriptionStyle = {
  fontSize: '1.1rem',
  lineHeight: 1.65,
  color: 'rgba(255, 255, 255, 0.9)',
  marginBottom: '2.5rem',
  fontWeight: '300',
  textShadow: '0 1px 5px rgba(0, 0, 0, 0.15)',
};

const heroActionsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1.2rem',
  flexWrap: 'wrap',
};

const heroBtnPinkStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.9rem 2.2rem',
  borderRadius: '999px',
  fontSize: '0.85rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  boxShadow: '0 4px 15px rgba(74, 52, 57, 0.08)',
  transition: 'all 0.3s ease',
  border: '1.5px solid #FBF0EC',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  textDecoration: 'none'
};

const heroBtnOutlineStyle = {
  backgroundColor: 'transparent',
  color: '#000000',
  border: '1px solid #000000',
  padding: '0.9rem 2.2rem',
  borderRadius: '999px',
  fontSize: '0.85rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  transition: 'all 0.3s ease',
};

const sectionHeaderStyle = {
  textAlign: 'center',
  marginBottom: '2rem',
  marginTop: '1.5rem',
};

const sectionSubStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: '#D98E9B', // Pink
  fontWeight: '600',
  display: 'block',
  marginBottom: '0.5rem',
};

const sectionTitleStyle = {
  fontSize: '2.2rem',
  fontFamily: 'var(--font-serif)',
  color: '#D98E9B',
};

const sectionDividerLineStyle = {
  width: '50px',
  height: '1px',
  backgroundColor: '#D98E9B',
  margin: '1rem auto 0 auto',
};

// Timeline Styles
const timelineSectionStyle = {
  padding: '1rem 0 5rem 0',
  backgroundColor: '#FFFFFF',
};

const timelineContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '2.5rem',
  position: 'relative',
  paddingTop: '2rem',
  margin: '0 auto',
  maxWidth: '1100px',
};

const timelineNodeStyle = {
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
};

const timelineYearStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.8rem',
  fontWeight: '600',
  color: '#000000',
  marginBottom: '0.6rem',
};

const timelineDotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#FFFFFF',
  marginBottom: '1.2rem',
  border: '2px solid #FFFFFF',
  boxShadow: '0 0 0 4px rgba(194,168,175,0.2)',
};

const timelineDotActiveStyle = {
  ...timelineDotStyle,
  backgroundColor: '#D98E9B',
  boxShadow: '0 0 0 6px rgba(74, 52, 57, 0.08)',
};

const timelineNodeTitleStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#D98E9B',
  marginBottom: '0.5rem',
  fontWeight: '600',
};

const timelineNodeTitleActiveStyle = {
  ...timelineNodeTitleStyle,
  color: '#000000',
};

const timelineNodeDescStyle = {
  fontSize: '0.8rem',
  color: '#000000',
  lineHeight: 1.5,
  maxWidth: '220px',
};

// Featured Collections Styles
const collectionsSectionStyle = {
  padding: '1rem 0 3rem 0',
  backgroundColor: '#FFFFFF', // White background
};

const loadingWrapperStyle = {
  textAlign: 'center',
  padding: '4rem',
  color: '#000000',
};

const collectionsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2.5rem',
  maxWidth: '1200px',
  margin: '0 auto',
};

const collectionCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 15px rgba(60, 48, 58, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(139, 119, 137, 0.05)',
};

const collectionCardPinkStyle = {
  ...collectionCardStyle,
  border: '1px solid #D98E9B',
  boxShadow: '0 10px 25px rgba(74, 52, 57, 0.08)',
};

const cardImageWrapperStyle = {
  position: 'relative',
  width: '100%',
  height: '350px',
  overflow: 'hidden',
};

const cardImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.5s ease',
};

const pinkCardBadgeStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.35rem 0.8rem',
  borderRadius: '999px',
  fontSize: '0.65rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  border: '1px solid #D98E9B',
  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
};

const cardContentStyle = {
  padding: '1.8rem',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const cardTitleStyle = {
  fontSize: '1.4rem',
  marginBottom: '0.5rem',
  color: '#D98E9B',
};

const cardDescStyle = {
  fontSize: '0.85rem',
  color: '#000000',
  lineHeight: 1.5,
  marginBottom: '1.5rem',
  flex: 1,
};

const cardLinkStyle = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: '600',
  color: '#000000',
};

const cardLinkPinkStyle = {
  ...cardLinkStyle,
  color: '#000000',
};

// Atelier Promo Styles
const atelierPromoSectionStyle = {
  backgroundColor: '#FFFFFF',
  color: '#000000',
  overflow: 'hidden',
};

const atelierPromoGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  minHeight: '480px',
  '@media (maxWidth: 768px)': {
    gridTemplateColumns: '1fr',
  },
};

const atelierPromoImgStyle = {
  backgroundImage: 'url("https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  minHeight: '350px',
};

const atelierPromoContentStyle = {
  padding: '4.5rem 3.5rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: '1.2rem',
};

const atelierPromoLabelStyle = {
  color: '#000000',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  fontWeight: '600',
};

const atelierPromoTitleStyle = {
  fontSize: '2.2rem',
  color: '#D98E9B',
  fontFamily: 'var(--font-serif)',
};

const atelierPromoDescStyle = {
  fontSize: '0.9rem',
  lineHeight: 1.6,
  color: '#000000',
  marginBottom: '1rem',
};

const atelierBtnStyle = {
  backgroundColor: 'transparent',
  color: '#000000',
  border: '1px solid #D98E9B',
  padding: '0.75rem 1.8rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const reviewsSectionStyle = {
  backgroundColor: '#FFFFFF',
  padding: '2rem 0 3.5rem 0',
};

const reviewsGridStyle = {
  display: 'flex',
  gap: '1.5rem',
  overflowX: 'auto',
  padding: '1rem 0.5rem 2rem 0.5rem',
  scrollSnapType: 'x mandatory',
};

const reviewImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const lightboxOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
};

const lightboxContentStyle = {
  position: 'relative',
  maxWidth: '90%',
  maxHeight: '90%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const lightboxCloseBtnStyle = {
  position: 'absolute',
  top: '-2.5rem',
  right: '0',
  backgroundColor: 'transparent',
  border: 'none',
  color: '#FFFFFF',
  fontSize: '1.5rem',
  cursor: 'pointer',
  padding: '0.5rem',
};

const lightboxImgStyle = {
  maxWidth: '100%',
  maxHeight: '85vh',
  borderRadius: '8px',
  objectFit: 'contain',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
};
