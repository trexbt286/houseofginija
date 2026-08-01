'use client';

import { useState, useRef, useEffect } from 'react';
import ReelPlayerModal from './ReelPlayerModal';

export default function HeroReelsSection({ heroReels = [], loading = false }) {
  const sectionRef = useRef(null);
  const scrollRef = useRef(null);
  const reelCardRefs = useRef([]);
  const videoRefs = useRef([]);
  const progressFillRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const nearIndexesRef = useRef(new Set([0, 1]));
  const sectionVisibleRef = useRef(true);
  const [loadedVideos, setLoadedVideos] = useState(new Set());
  const [requestedVideoIndexes, setRequestedVideoIndexes] = useState(() => new Set([0, 1]));
  const [selectedReel, setSelectedReel] = useState(null);

  const handleVideoLoad = (id) => {
    setLoadedVideos((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Handle scroll progress detection
  const handleScroll = () => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const track = scrollRef.current;
      const fill = progressFillRef.current;
      if (!track || !fill) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const progress = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
      fill.style.transform = `translate3d(${progress * 300}%, 0, 0)`;
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => {
        el.removeEventListener('scroll', handleScroll);
        if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
      };
    }
  }, [heroReels]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      const indexesToRequest = [];
      entries.forEach((entry) => {
        const index = Number(entry.target.dataset.reelIndex);
        const video = videoRefs.current[index];
        if (entry.isIntersecting) {
          nearIndexesRef.current.add(index);
          indexesToRequest.push(index);
          if (sectionVisibleRef.current && !selectedReel) video?.play().catch(() => {});
        } else {
          nearIndexesRef.current.delete(index);
          video?.pause();
        }
      });

      if (indexesToRequest.length > 0) {
        setRequestedVideoIndexes((previous) => {
          const next = new Set(previous);
          indexesToRequest.forEach((index) => next.add(index));
          return next.size === previous.size ? previous : next;
        });
      }
    }, { root, rootMargin: '0px 100% 0px 100%', threshold: 0.01 });

    reelCardRefs.current.slice(0, heroReels.length).forEach((card) => {
      if (card) observer.observe(card);
    });
    return () => observer.disconnect();
  }, [heroReels.length, selectedReel]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      sectionVisibleRef.current = entry.isIntersecting;
      videoRefs.current.forEach((video, index) => {
        if (!video) return;
        if (entry.isIntersecting && !selectedReel && nearIndexesRef.current.has(index)) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.01 });

    observer.observe(section);
    return () => observer.disconnect();
  }, [selectedReel]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (!selectedReel && sectionVisibleRef.current && nearIndexesRef.current.has(index)) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [requestedVideoIndexes, selectedReel]);

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

  const hasReels = heroReels && heroReels.length > 0;
  const showSkeleton = loading || !hasReels;

  return (
    <section ref={sectionRef} className="hero-reels-container" style={sectionContainerStyle}>
      <div style={carouselWrapperStyle}>
        {/* Navigation Arrow Left */}
        {!showSkeleton && heroReels.length > 2 && (
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
          {showSkeleton ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} style={reelCardStyle} className="reel-card-item">
                <div style={videoWrapperStyle}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: '#F6DDE2',
                      borderRadius: '24px'
                    }}
                    className="skeleton-pulse"
                  />
                </div>
              </div>
            ))
          ) : (
            heroReels.map((reel, idx) => {
              const isVideoLoaded = loadedVideos.has(reel.id || idx);
              const shouldLoadVideo = requestedVideoIndexes.has(idx);
              return (
                <button
                  ref={(element) => { reelCardRefs.current[idx] = element; }}
                  data-reel-index={idx}
                  type="button"
                  key={reel.id || idx}
                  style={reelCardStyle}
                  className="reel-card-item reel-card-button"
                  onClick={() => setSelectedReel(reel)}
                  aria-label={`Open ${reel.title || `reel ${idx + 1}`}`}
                >
                  <div style={videoWrapperStyle}>
                    {!isVideoLoaded && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: '#F6DDE2',
                          zIndex: 1
                        }}
                        className="skeleton-pulse"
                      />
                    )}
                    <video
                      ref={(element) => { videoRefs.current[idx] = element; }}
                      src={shouldLoadVideo ? reel.video_url : undefined}
                      autoPlay={shouldLoadVideo && !selectedReel}
                      muted
                      loop
                      playsInline
                      preload={shouldLoadVideo ? 'auto' : 'none'}
                      onCanPlay={() => handleVideoLoad(reel.id || idx)}
                      style={videoElementStyle}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Navigation Arrow Right */}
        {!showSkeleton && heroReels.length > 2 && (
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
          <div ref={progressFillRef} style={progressBarFillStyle} />

        </div>
      </div>

      <ReelPlayerModal reel={selectedReel} reels={heroReels} onClose={() => setSelectedReel(null)} />

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

        .reel-card-button {
          padding: 0;
          border: 0;
          color: inherit;
          font: inherit;
          cursor: pointer;
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
  backgroundColor: '#F6DDE2',
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
  backgroundColor: '#F6DDE2',
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
  transform: 'translate3d(0, 0, 0)',
  willChange: 'transform',
};
