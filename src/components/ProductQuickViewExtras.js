'use client';

const FEATURE_ITEMS = [
  {
    label: 'Premium Quality',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 15 5l3.3-.2.7 3.2 2.2 2.4-2.2 2.4-.7 3.2-3.3-.2-3 1.5-3-1.5-3.3.2-.7-3.2-2.2-2.4L5 8l.7-3.2L9 5l3-1.5Z" />
        <path d="m8.8 10.6 2.1 2.1 4.4-4.4" />
        <path d="m9.2 16.8-.8 3.7 3.6-1.8 3.6 1.8-.8-3.7" />
      </svg>
    ),
  },
  {
    label: 'Tailored Fit',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="7" width="18" height="10" rx="5" />
        <path d="M7 7v4m3-4v2m4-2v4m3-4v2" />
      </svg>
    ),
  },
  {
    label: 'Easy Returns',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 7v5a8 8 0 1 1-2.3-5.7" />
        <path d="M20 3v4h-4" />
      </svg>
    ),
  },
  {
    label: 'Secure Payment',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z" />
        <path d="m9.2 11.8 1.8 1.8 3.8-4" />
      </svg>
    ),
  },
];

export function ProductFeatureStrip() {
  return (
    <div className="detail-feature-strip" aria-label="Product benefits">
      {FEATURE_ITEMS.map((item) => (
        <div className="detail-feature-item" key={item.label}>
          <span className="detail-feature-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProductShareButton({ product }) {
  const handleShare = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const url = window.location.origin + '/products/' + product.slug;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.error('Unable to share product', error);
    }
  };

  return (
    <button
      type="button"
      className="detail-share-btn-overlay"
      onClick={handleShare}
      aria-label={'Share ' + product.name}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 16V3" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      </svg>
    </button>
  );
}

export function ProductTagBadges({ tags }) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  const normalizedTags = tags
    .map((tag) => {
      if (typeof tag === 'string') {
        try {
          const parsed = JSON.parse(tag);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch {}
        return { name: tag };
      }
      return tag;
    })
    .filter(Boolean);

  if (normalizedTags.length === 0) return null;

  return (
    <div className="product-tag-badges">
      {normalizedTags.map((tag, idx) => {
        const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.slug);
        if (!tagName) return null;

        return (
          <span className="product-tag-badge" key={tag?.id || tag?.slug || idx}>
            {tagName}
          </span>
        );
      })}
    </div>
  );
}

export function AddToBagLabel() {
  return (
    <span className="detail-add-label">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8h12l1 13H5L6 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </svg>
      <span>Add to Bag</span>
    </span>
  );
}
