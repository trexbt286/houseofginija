'use client';

export function AdminProductMetadataFields({
  tags,
  selectedTagIds,
  onSelectedTagIdsChange,
  onSale,
  onSaleChange,
}) {
  const toggleTag = (tagId) => {
    const selected = selectedTagIds.includes(tagId);
    onSelectedTagIdsChange(
      selected
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]
    );
  };

  return (
    <>
      <div style={fieldGroupStyle}>
        <h3 style={sectionTitleStyle}>Product Tags</h3>
        <div style={tagOptionsStyle}>
          {tags.map((tag) => {
            const tagId = Number(tag.id);
            const selected = selectedTagIds.includes(tagId);
            return (
              <label key={tag.id} style={selected ? selectedTagStyle : tagStyle}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleTag(tagId)}
                />
                <span>{tag.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={checkboxGroupStyle}>
        <input
          type="checkbox"
          id="on_sale"
          checked={onSale}
          onChange={(event) => onSaleChange(event.target.checked)}
          style={checkboxStyle}
        />
        <label htmlFor="on_sale" style={checkboxLabelStyle}>
          On Sale (prioritize this product in category listings)
        </label>
      </div>
    </>
  );
}

export function AdminProductMetadataBadges({ product }) {
  const tags = Array.isArray(product.tags) ? product.tags : [];
  if (!product.on_sale && tags.length === 0) return null;

  return (
    <div style={metadataRowStyle}>
      {product.on_sale && <span style={onSaleBadgeStyle}>On Sale</span>}
      {tags.map((tag) => (
        <span key={tag.id || tag.slug} style={tagBadgeStyle}>
          {tag.name}
        </span>
      ))}
    </div>
  );
}

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const sectionTitleStyle = {
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#D98E9B',
  fontWeight: '700',
  marginBottom: '0.5rem',
};

const tagOptionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.55rem',
};

const tagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.7rem',
  borderRadius: '999px',
  border: '1px solid rgba(217, 142, 155, 0.45)',
  color: '#2D2429',
  backgroundColor: '#FFFFFF',
  fontSize: '0.78rem',
  cursor: 'pointer',
};

const selectedTagStyle = {
  ...tagStyle,
  backgroundColor: '#F6DDE2',
  borderColor: '#D98E9B',
};

const checkboxGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentColor: '#D98E9B',
};

const checkboxLabelStyle = {
  fontSize: '0.82rem',
  color: '#000000',
  fontWeight: '600',
};

const metadataRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.3rem',
  marginTop: '0.35rem',
};

const tagBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.16rem 0.45rem',
  borderRadius: '999px',
  backgroundColor: '#F6DDE2',
  color: '#8A4F5D',
  border: '1px solid rgba(217, 142, 155, 0.5)',
  fontSize: '0.62rem',
  fontWeight: '700',
};

const onSaleBadgeStyle = {
  ...tagBadgeStyle,
  backgroundColor: '#D98E9B',
  color: '#FFFFFF',
};
