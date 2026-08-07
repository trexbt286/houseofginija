'use client';

import { useEffect, useRef, useState } from 'react';
import ReelPlayerModal from './ReelPlayerModal';

export default function FounderReelsRow({ founderReels = [], loading = false }) {
  const sectionRef = useRef(null);
  const videoRefs = useRef([]);
  const scrollPosRef = useRef(0);
  const [shouldLoadVideos, setShouldLoadVideos] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [playingVideos, setPlayingVideos] = useState(new Set());
  const [selectedReel, setSelectedReel] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVideoPlaying = (id) => {
    setPlayingVideos((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleOpenReel = (reel) => {
    const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    scrollPosRef.current = currentY;
    if (typeof window !== 'undefined') {
      window.history.pushState({ founderReelOpen: true }, '');
    }
    setSelectedReel(reel);
  };

  const handleCloseReel = () => {
    setSelectedReel(null);
    const targetY = scrollPosRef.current;
    if (typeof window !== 'undefined' && window.history.state?.founderReelOpen) {
      window.history.back();
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, targetY);
      setTimeout(() => window.scrollTo(0, targetY), 50);
    });
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedReel) {
        setSelectedReel(null);
        const targetY = scrollPosRef.current;
        requestAnimationFrame(() => {
          window.scrollTo(0, targetY);
          setTimeout(() => window.scrollTo(0, targetY), 50);
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedReel]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      setShouldLoadVideos(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoadVideos(true);
        observer.disconnect();
      }
    }, { rootMargin: '700px 0px', threshold: 0 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      setIsSectionVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsSectionVisible(entry.isIntersecting);
    }, { threshold: 0.01 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      if (isSectionVisible && !selectedReel) video.play().catch(() => {});
      else video.pause();
    });
  }, [isSectionVisible, selectedReel, shouldLoadVideos]);
  const fallbackReels = [
    { id: 'f6', video_url: '/videos/hero_reels/reel_6.mp4', title: 'Hero Reel 6' },
    { id: 'f7', video_url: '/videos/hero_reels/reel_7.mp4', title: 'Hero Reel 7' },
    { id: 'f8', video_url: '/videos/hero_reels/reel_8.mp4', title: 'Hero Reel 8' },
  ];

  const reelsToDisplay = (founderReels && founderReels.length > 0)
    ? founderReels.slice(0, 3)
    : fallbackReels;

  const showSkeleton = loading;

  return (
    <div ref={sectionRef} className="founder-reels-row-wrapper" style={{ width: '100%', maxWidth: '800px', margin: '2.5rem auto 0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.6rem',
          width: '100%'
        }}
        className="founder-reels-grid"
      >
        {showSkeleton ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '9/16',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#F6DDE2'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#F6DDE2',
                  borderRadius: '16px'
                }}
                className="skeleton-pulse"
              />
            </div>
          ))
        ) : (
          reelsToDisplay.map((reel, idx) => {
            const isVideoPlaying = playingVideos.has(reel.id || idx);
            return (
              <button
                key={reel.id || idx}
                type="button"
                onClick={() => handleOpenReel(reel)}
                aria-label={`Open ${reel.title || `Founder Reel ${idx + 1}`}`}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '9/16',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#F6DDE2',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  padding: 0,
                  border: 0,
                  cursor: 'pointer'
                }}
              >
                {!isVideoPlaying && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: '#F6DDE2',
                      zIndex: 1,
                      borderRadius: '16px'
                    }}
                    className="skeleton-pulse"
                  />
                )}
                <video
                  ref={(element) => { videoRefs.current[idx] = element; }}
                  src={(isMounted && shouldLoadVideos) ? reel.video_url : undefined}
                  autoPlay={isMounted && isSectionVisible && !selectedReel}
                  muted
                  loop
                  playsInline
                  preload={shouldLoadVideos ? 'auto' : 'none'}
                  onPlaying={(e) => {
                    if (e.target && e.target.currentTime > 0.1) {
                      handleVideoPlaying(reel.id || idx);
                    }
                  }}
                  onTimeUpdate={(e) => {
                    if (e.target && e.target.currentTime > 0.1) {
                      handleVideoPlaying(reel.id || idx);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: (isMounted && isVideoPlaying) ? 1 : 0,
                    transition: 'opacity 0.35s ease',
                  }}
                />
              </button>
            );
          })
        )}
      </div>
      <ReelPlayerModal reel={selectedReel} reels={reelsToDisplay} onClose={handleCloseReel} />
    </div>
  );
}
