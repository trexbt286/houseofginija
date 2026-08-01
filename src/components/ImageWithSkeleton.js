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

export default function ImageWithSkeleton({ src, alt, style = {}, className = '', eager = false, ...props }) {
  const [loaded, setLoaded] = useState(false);

  const finalStyle = {
    backgroundColor: loaded ? '#FBF0EC' : '#F6DDE2',
    transition: 'background-color 0.4s ease, opacity 0.4s ease',
    opacity: loaded ? 1 : 0.85,
    ...style,
  };

  const optimizedSrc = optimizeCloudinaryUrl(src);

  return (
    <img
      src={optimizedSrc || '/icon.png'}
      alt={alt || ''}
      loading={eager ? "eager" : "lazy"}
      onLoad={() => setLoaded(true)}
      style={finalStyle}
      className={`${!loaded ? 'skeleton-shimmer' : ''} ${className}`}
      {...props}
    />
  );
}
