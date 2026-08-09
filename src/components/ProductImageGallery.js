'use client';

import { useState, useRef, useEffect } from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function ProductImageGallery({ images = [], name = '' }) {
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset active index when images list changes (e.g., product selection changes)
  useEffect(() => {
    setActiveIdx(0);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [images]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      if (idx !== activeIdx) {
        setActiveIdx(idx);
      }
    }
  };

  const scrollToImage = (idx) => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: idx * clientWidth,
      behavior: 'smooth',
    });
  };

  const galleryImages = images && images.length > 0 ? images : ['/placeholder.jpg'];

  return (
    <div className="product-image-gallery-container" style={containerStyle}>
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        style={scrollTrackStyle} 
        className="gallery-scroll-track"
      >
        {galleryImages.map((img, idx) => (
          <div key={idx} style={slideStyle} className="gallery-slide">
            <ImageWithSkeleton
              src={img}
              alt={`${name} - View ${idx + 1}`}
              style={imageStyle}
              className="gallery-image"
            />
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      {galleryImages.length > 1 && (
        <div style={dotsContainerStyle} className="gallery-dots">
          {galleryImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToImage(idx)}
              style={{
                ...dotStyle,
                backgroundColor: idx === activeIdx ? '#D98E9B' : 'rgba(255, 255, 255, 0.6)',
                transform: idx === activeIdx ? 'scale(1.2)' : 'scale(1)',
                boxShadow: idx === activeIdx ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scoped CSS for swipe gallery */}
      <style jsx>{`
        .product-image-gallery-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .gallery-scroll-track {
          display: flex;
          width: 100%;
          height: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }

        .gallery-scroll-track::-webkit-scrollbar {
          display: none;
        }

        .gallery-slide {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          scroll-snap-align: start;
          position: relative;
        }
      `}</style>
    </div>
  );
}

const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#FBF0EC',
};

const scrollTrackStyle = {
  width: '100%',
  height: '100%',
  maxHeight: '430px',
};

const slideStyle = {
  width: '100%',
  height: '100%',
  maxHeight: '430px',
};

const imageStyle = {
  width: '100%',
  height: '100%',
  maxHeight: '430px',
  objectFit: 'contain',
  display: 'block',
};

const dotsContainerStyle = {
  position: 'absolute',
  bottom: '12px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '6px',
  zIndex: 10,
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  padding: '6px 10px',
  borderRadius: '20px',
  backdropFilter: 'blur(4px)',
};

const dotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  transition: 'background-color 0.25s ease, transform 0.25s ease',
};
