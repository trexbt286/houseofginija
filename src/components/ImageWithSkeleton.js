'use client';

import { useState } from 'react';

function optimizeCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('f_auto') || url.includes('q_auto')) return url;

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + 8);
  const suffix = url.substring(uploadIndex + 8);
  return `${prefix}f_auto,q_auto/${suffix}`;
}

const DEFAULT_FALLBACK_IMAGE = 'https://res.cloudinary.com/cyygtyfb/image/upload/v1786258845/houseofginija/local-products/002-bespoke-suit-6-1.jpg';

export default function ImageWithSkeleton({ src, alt, style = {}, className = '', eager = false, fallbackSrc = DEFAULT_FALLBACK_IMAGE, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => optimizeCloudinaryUrl(src) || fallbackSrc);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    setLoaded(true);
  };

  const finalStyle = {
    backgroundColor: loaded ? '#FBF0EC' : '#F6DDE2',
    transition: 'background-color 0.4s ease, opacity 0.4s ease',
    opacity: loaded ? 1 : 0.85,
    ...style,
  };

  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      loading={eager ? "eager" : "lazy"}
      onLoad={() => setLoaded(true)}
      onError={handleError}
      style={finalStyle}
      className={`${!loaded ? 'skeleton-shimmer' : ''} ${className}`}
      {...props}
    />
  );
}
