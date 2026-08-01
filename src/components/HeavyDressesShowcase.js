'use client';

import Link from 'next/link';
import FounderReelsRow from './FounderReelsRow';
import ImageWithSkeleton from './ImageWithSkeleton';
import SkeletonCard from './SkeletonCard';

export default function HeavyDressesShowcase({ reels = [], products = [], loading = false }) {
  return (
    <section style={sectionStyle}>
      <div className="container" style={innerStyle}>
        <h2 style={headingStyle}>Shop Heavy Dresses</h2>
        <div style={dividerStyle} />
        <FounderReelsRow founderReels={reels} loading={loading} />

        <div style={gridStyle}>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} type="home-new-arrival" />)
            : products.slice(0, 4).map((product, index) => (
              <Link
                href={'/products/' + product.slug}
                className="heavy-dresses-product-card"
                style={cardStyle}
                key={product.id + '-' + index}
              >
                <span style={imageFrameStyle}>
                  <ImageWithSkeleton
                    src={product.images?.[0] || '/icon.png'}
                    alt={product.name}
                    eager={index < 2}
                    style={imageStyle}
                  />
                </span>
                <span style={nameStyle}>{product.name}</span>
                <span style={priceStyle}>₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
              </Link>
            ))}
        </div>

        <Link href="/collections?collection=suits&category=heavy-dresses" style={seeMoreStyle}>
          See More
        </Link>
      </div>
    </section>
  );
}

const sectionStyle = {
  padding: '3.75rem 1rem 4rem',
  backgroundColor: '#FAF5F6',
  textAlign: 'center',
};

const innerStyle = {
  maxWidth: '800px',
  margin: '0 auto',
};

const headingStyle = {
  margin: 0,
  color: '#B97285',
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(2rem, 6vw, 2.65rem)',
  fontWeight: 500,
};

const dividerStyle = {
  width: '54px',
  height: '1px',
  margin: '1rem auto 0',
  backgroundColor: '#D98E9B',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1.5rem 0.9rem',
  margin: '2.75rem auto 2.25rem',
};

const cardStyle = {
  minWidth: 0,
  color: 'inherit',
  textAlign: 'left',
  textDecoration: 'none',
};

const imageFrameStyle = {
  display: 'block',
  width: '100%',
  aspectRatio: '3 / 4',
  overflow: 'hidden',
  borderRadius: '12px',
  backgroundColor: '#F3DFE4',
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const nameStyle = {
  display: 'block',
  marginTop: '0.75rem',
  color: '#352B30',
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(0.95rem, 3.7vw, 1.15rem)',
  lineHeight: 1.3,
};

const priceStyle = {
  display: 'block',
  marginTop: '0.3rem',
  color: '#B97285',
  fontSize: '0.92rem',
  fontWeight: 700,
};

const seeMoreStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '132px',
  padding: '0.78rem 1.8rem',
  border: '1.5px solid #B97285',
  borderRadius: '999px',
  color: '#B97285',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textDecoration: 'none',
  textTransform: 'uppercase',
};