export default function SkeletonCard({ type = 'collection' }) {
  if (type === 'flash') {
    return (
      <div style={{ position: 'relative' }}>
        <div 
          className="skeleton-shimmer"
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: '12px',
            marginBottom: '0.8rem',
          }}
        />
        <div className="skeleton-shimmer" style={{ width: '80%', height: '1.2rem', marginBottom: '0.4rem', borderRadius: '4px' }} />
        <div className="skeleton-shimmer" style={{ width: '40%', height: '1rem', borderRadius: '4px' }} />
      </div>
    );
  }

  if (type === 'home-flash') {
    return (
      <div className="flash-sale-card" style={{ position: 'relative' }}>
        <div 
          className="skeleton-pulse flash-sale-img-container"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '0.8rem',
          }}
        />
        <div className="skeleton-pulse" style={{ width: '70%', height: '1.1rem', marginBottom: '0.3rem', borderRadius: '4px' }} />
        <div className="skeleton-pulse" style={{ width: '40%', height: '1rem', borderRadius: '4px' }} />
      </div>
    );
  }

  if (type === 'home-signature') {
    return (
      <div className="collections-grid-card" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(60, 48, 58, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(139, 119, 137, 0.05)',
        height: '100%',
      }}>
        <div 
          className="skeleton-pulse"
          style={{
            position: 'relative',
            width: '100%',
            height: '350px',
            overflow: 'hidden',
            borderRadius: '8px',
          }}
        />
        <div className="collections-grid-card-content" style={{
          padding: '1.8rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
        }}>
          <div className="skeleton-pulse" style={{ width: '24px', height: '1px', marginBottom: '1.2rem' }} />
          <div className="skeleton-pulse" style={{ width: '60%', height: '1.8rem', marginBottom: '0.6rem', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ width: '90%', height: '0.85rem', marginBottom: '1.8rem', borderRadius: '4px' }} />
          <div style={{ flexGrow: 1 }}></div>
          <div className="skeleton-pulse" style={{ width: '140px', height: '1.2rem', borderRadius: '2px', marginTop: 'auto' }} />
        </div>
      </div>
    );
  }

  // Collection card
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid rgba(139, 119, 137, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div 
        className="skeleton-shimmer collections-product-image-wrapper"
        style={{
          width: '100%',
          height: '320px',
        }}
      />
      <div 
        className="collections-product-card-content"
        style={{
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
          gap: '0.3rem',
        }}
      >
        <div>
          <div className="skeleton-shimmer" style={{ width: '40%', height: '0.8rem', marginBottom: '0.5rem', borderRadius: '4px' }} />
          <div className="skeleton-shimmer" style={{ width: '90%', height: '1.2rem', marginBottom: '0.8rem', borderRadius: '4px' }} />
          <div className="skeleton-shimmer" style={{ width: '50%', height: '1rem', borderRadius: '4px' }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: '100%', height: '36px', marginTop: '0.8rem', borderRadius: '4px' }} />
      </div>
    </div>
  );
}
