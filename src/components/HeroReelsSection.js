'use client';

import { useState, useRef, useEffect } from 'react';

export default function HeroReelsSection({ heroReels = [] }) {
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Handle scroll progress detection
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      const progress = (scrollLeft / maxScroll) * 100;
      setScrollProgress(progress);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [heroReels]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  if (!heroReels || heroReels.length === 0) return null;

  return (
    <section className="hero-reels-container" style={sectionContainerStyle}>
      <div style={carouselWrapperStyle}>
        {/* Navigation Arrow Left */}
        {heroReels.length > 2 && (
          <button
            onClick={scrollLeft}
            style={{ ...arrowButtonStyle, left: '12px' }}
            aria-label="Previous reels"
            className="reels-arrow-btn left"
          >
            ‹
          </button>
        )}

        {/* Scrollable 2-Card Horizontal Container */}
        <div ref={scrollRef} style={scrollTrackStyle} className="reels-scroll-track">
          {heroReels.map((reel, idx) => (
            <div key={reel.id || idx} style={reelCardStyle} className="reel-card-item">
              <div style={videoWrapperStyle}>
                <video
                  src={reel.video_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  style={videoElementStyle}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrow Right */}
        {heroReels.length > 2 && (
          <button
            onClick={scrollRight}
            style={{ ...arrowButtonStyle, right: '12px' }}
            aria-label="Next reels"
            className="reels-arrow-btn right"
          >
            ›
          </button>
        )}
      </div>

      {/* Progress Indicator Bar Matching Image 2 */}
      <div style={progressTrackContainerStyle} className="reels-progress-container">
        <div style={progressTrackBgStyle}>
          <div
            style={{
              ...progressBarFillStyle,
              left: `${(scrollProgress * (1 - 0.25)).toFixed(2)}%`,
            }}
          />
        </div>
      </div>

      {/* Scoped CSS for responsive 2-card layout */}
      <style jsx>{`
        .hero-reels-container {
          width: 100%;
          box-sizing: border-box;
          padding: 1rem 0.8rem 1.5rem 0.8rem;
          background-color: #FAF5F6;
        }

        .reels-scroll-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 0 4px;
        }

        .reels-scroll-track::-webkit-scrollbar {
          display: none;
        }

        .reel-card-item {
          flex: 0 0 calc(50% - 6px);
          max-width: calc(50% - 6px);
          scroll-snap-align: start;
          box-sizing: border-box;
        }

        @media (min-width: 768px) {
          .hero-reels-container {
            padding: 2rem 3rem;
          }
          .reels-scroll-track {
            gap: 20px;
            justify-content: center;
          }
          .reel-card-item {
            flex: 0 0 calc(50% - 10px);
            max-width: 380px;
          }
        }
      `}</style>
    </section>
  );
}

const sectionContainerStyle = {
  position: 'relative',
  overflow: 'hidden',
};

const carouselWrapperStyle = {
  position: 'relative',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
};

const scrollTrackStyle = {
  width: '100%',
};

const reelCardStyle = {
  position: 'relative',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  backgroundColor: '#000000',
  aspectRatio: '9 / 16',
};

const videoWrapperStyle = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
};

const videoElementStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const placeholderStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: '#2A2426',
};

const arrowButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  backgroundColor: 'rgba(255, 255, 255, 0.75)',
  color: '#000000',
  border: 'none',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.4rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  backdropFilter: 'blur(4px)',
};

const progressTrackContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: '1.2rem',
  padding: '0 1rem',
};

const progressTrackBgStyle = {
  position: 'relative',
  width: '85%',
  maxWidth: '320px',
  height: '3px',
  backgroundColor: 'rgba(0, 0, 0, 0.15)',
  borderRadius: '2px',
  overflow: 'hidden',
};

const progressBarFillStyle = {
  position: 'absolute',
  top: 0,
  width: '25%',
  height: '100%',
  backgroundColor: '#000000',
  borderRadius: '2px',
  transition: 'left 0.1s linear',
};
