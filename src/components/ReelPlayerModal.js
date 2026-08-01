'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ReelPlayerModal({ reel, reels = [], onClose }) {
  const videoRef = useRef(null);
  const touchStartRef = useRef(null);
  const didSwipeRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const reelList = reels.length > 0 ? reels : (reel ? [reel] : []);
  const activeReel = reelList[activeIndex] || reel;

  const changeReel = (direction) => {
    if (reelList.length < 2) return;
    setActiveIndex((current) => (current + direction + reelList.length) % reelList.length);
    setIsPlaying(true);
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  useEffect(() => {
    if (!reel) return;
    const nextIndex = reelList.findIndex((item) => (item.id || item.video_url) === (reel.id || reel.video_url));
    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [reel, reels]);

  useEffect(() => {
    if (!reel) return undefined;

    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') changeReel(1);
      if (event.key === 'ArrowLeft') changeReel(-1);
      if (event.key === ' ') {
        event.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
      window.removeEventListener('keydown', handleKeyDown);
      window.scrollTo(0, scrollY);
    };
  }, [reel, onClose, reelList.length]);

  if (!reel || !activeReel) return null;

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    didSwipeRef.current = false;
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didSwipeRef.current = true;
      changeReel(deltaX < 0 ? 1 : -1);
    }
  };

  return createPortal((
    <div
      className="reel-player"
      role="dialog"
      aria-modal="true"
      aria-label={activeReel.title || 'Reel player'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="reel-player__back" onClick={onClose} autoFocus aria-label="Back to page">
        <span aria-hidden="true" />
      </button>

      <div className="reel-player__frame" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <video
          key={activeReel.id || activeReel.video_url}
          ref={videoRef}
          src={activeReel.video_url}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          onClick={() => {
            if (didSwipeRef.current) {
              didSwipeRef.current = false;
              return;
            }
            togglePlayback();
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {reelList.length > 1 && (
          <div className="reel-player__dots" aria-label="Choose reel">
            {reelList.map((item, index) => (
              <button
                type="button"
                key={item.id || item.video_url || index}
                className={index === activeIndex ? 'active' : ''}
                onClick={() => {
                  setActiveIndex(index);
                  setIsPlaying(true);
                }}
                aria-label={`Open reel ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              />
            ))}
          </div>
        )}

        <div className="reel-player__controls">
          <button type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause reel' : 'Play reel'}>
            <span aria-hidden="true">{isPlaying ? '\u275A\u275A' : '\u25B6'}</span>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={toggleSound} aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}>
            <span aria-hidden="true">{isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}</span>
            {isMuted ? 'Sound on' : 'Sound off'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .reel-player {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: rgba(10, 8, 9, 0.42);
          backdrop-filter: blur(4px);
          overscroll-behavior: none;
        }
        .reel-player__back {
          position: fixed;
          top: max(1rem, env(safe-area-inset-top));
          left: 1rem;
          z-index: 4;
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0,0,0,.2);
        }
        .reel-player__back span {
          width: 10px;
          height: 10px;
          border-right: 2px solid #111;
          border-bottom: 2px solid #111;
          transform: translateY(-2px) rotate(45deg);
        }
        .reel-player__frame {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100dvh;
          margin: 0;
          padding: 0;
          overflow: hidden;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          touch-action: pan-y;
        }
        .reel-player__frame video {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100dvh;
          margin: 0;
          padding: 0;
          display: block;
          object-fit: cover;
          cursor: pointer;
        }
        .reel-player__dots {
          position: absolute;
          right: 1rem;
          bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 62px);
          left: 1rem;
          z-index: 3;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
        }
        .reel-player__dots button {
          width: 7px;
          height: 7px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.48);
          box-shadow: 0 1px 5px rgba(0,0,0,.22);
          transition: width .2s ease, background .2s ease;
        }
        .reel-player__dots button.active {
          width: 20px;
          border-radius: 999px;
          background: #fff;
        }
        .reel-player__controls {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .65rem;
          padding: 2.75rem 1rem max(1rem, env(safe-area-inset-bottom));
          background: linear-gradient(transparent, rgba(0,0,0,.82));
        }
        .reel-player__controls button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          min-height: 46px;
          border: 1px solid rgba(255,255,255,.24);
          border-radius: 999px;
          background: rgba(255,255,255,.14);
          color: #fff;
          font-size: .78rem;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        .reel-player__controls button span { font-size: .95rem; }
      `}</style>
    </div>
  ), document.body);
}