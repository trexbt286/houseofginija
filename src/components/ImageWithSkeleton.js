'use client';

import { useState } from 'react';

export default function ImageWithSkeleton({ src, alt, style = {}, className = '', eager = false, ...props }) {
  const [loaded, setLoaded] = useState(false);

  const finalStyle = {
    backgroundColor: loaded ? 'transparent' : '#F6DDE2',
    transition: 'background-color 0.4s ease, opacity 0.4s ease',
    opacity: loaded ? 1 : 0.85,
    ...style,
  };

  return (
    <img
      src={src || '/icon.png'}
      alt={alt || ''}
      loading={eager ? "eager" : "lazy"}
      onLoad={() => setLoaded(true)}
      style={finalStyle}
      className={`${!loaded ? 'skeleton-shimmer' : ''} ${className}`}
      {...props}
    />
  );
}
