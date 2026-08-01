'use client';

import { useEffect, useRef, useState } from 'react';
import ReelPlayerModal from './ReelPlayerModal';

export default function FounderReelsRow({ founderReels = [], loading = false }) {
  const sectionRef = useRef(null);
  const videoRefs = useRef([]);
  const [shouldLoadVideos, setShouldLoadVideos] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [loadedVideos, setLoadedVideos] = useState(new Set());
  const [selectedReel, setSelectedReel] = useState(null);

  const handleVideoLoad = (id) => {
    setLoadedVideos((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

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
    { id: 'f1', video_url: '/videos/hero_reels/reel_1.mp4', title: 'Founder Reel 1' },
    { id: 'f2', video_url: '/videos/hero_reels/reel_2.mp4', title: 'Founder Reel 2' },
    { id: 'f3', video_url: '/videos/hero_reels/reel_3.mp4', title: 'Founder Reel 3' },
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
            const isVideoLoaded = loadedVideos.has(reel.id || idx);
            return (
              <button
                type="button"
                key={reel.id || idx}
                onClick={() => setSelectedReel(reel)}
                aria-label={`Open ${reel.title || `reel ${idx + 1}`}`}
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
                {!isVideoLoaded && (
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
                  src={shouldLoadVideos ? reel.video_url : undefined}
                  autoPlay={isSectionVisible && !selectedReel}
                  muted
                  loop
                  playsInline
                  preload={shouldLoadVideos ? 'auto' : 'none'}
                  onCanPlay={() => handleVideoLoad(reel.id || idx)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            );
          })
        )}
      </div>
      <ReelPlayerModal reel={selectedReel} reels={reelsToDisplay} onClose={() => setSelectedReel(null)} />
    </div>
  );
}
