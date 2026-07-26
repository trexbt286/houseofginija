'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminHeroReelsPage() {
  const { logout } = useStore();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchReels = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/hero-reels');
      if (!res.ok) throw new Error('Failed to fetch hero reels.');
      const data = await res.json();
      setReels(data.reels || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching reels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const handleAddReel = async (e) => {
    e.preventDefault();
    if (!selectedFile && !videoUrl.trim()) {
      setError('Please select a video file to upload or enter a video URL.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title.trim() || 'Hero Reel');
        
        res = await fetch('/api/admin/hero-reels', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/hero-reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url: videoUrl.trim(),
            title: title.trim() || 'Hero Reel',
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add reel.');

      setSuccess('Hero reel added successfully!');
      setTitle('');
      setVideoUrl('');
      setSelectedFile(null);
      fetchReels();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error uploading reel.');
    } finally {
      setUploading(false);
    }
  };

  const handleMove = async (index, direction) => {
    const newReels = [...reels];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newReels.length) return;

    // Swap
    const temp = newReels[index];
    newReels[index] = newReels[targetIndex];
    newReels[targetIndex] = temp;

    setReels(newReels);

    try {
      const res = await fetch('/api/admin/hero-reels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reels: newReels }),
      });
      if (!res.ok) throw new Error('Failed to update sort order.');
    } catch (err) {
      console.error(err);
      setError('Failed to save reordered reels.');
      fetchReels(); // revert
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hero reel?')) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/hero-reels?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete reel.');
      setSuccess('Reel deleted successfully.');
      setReels(reels.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error deleting reel.');
    }
  };

  return (
    <div style={containerStyle} className="admin-container">
      <AdminSidebar active="hero-reels" />

      <main style={mainContentStyle} className="admin-main">
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Hero Reels Management</h1>
            <p style={subtitleStyle}>Upload, reorder, and manage homepage hero video reels</p>
          </div>
          <button onClick={logout} style={logoutBtnStyle} className="admin-btn">
            Sign Out
          </button>
        </header>

        {error && <div style={errorBannerStyle}>{error}</div>}
        {success && <div style={successBannerStyle}>{success}</div>}

        {/* Upload Form Section */}
        <section style={cardSectionStyle}>
          <h2 style={sectionHeadingStyle}>Add New Hero Reel Video</h2>
          <form onSubmit={handleAddReel} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Reel Title / Caption (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Royal Wedding Collection 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={dualUploadGridStyle}>
              <div style={uploadBoxStyle}>
                <label style={labelStyle}>Upload Video File (Cloudinary)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setVideoUrl('');
                    }
                  }}
                  style={fileInputStyle}
                />
                {selectedFile && (
                  <p style={fileNoticeStyle}>Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                )}
              </div>

              <div style={orDividerStyle}>OR</div>

              <div style={uploadBoxStyle}>
                <label style={labelStyle}>Paste Direct Video URL</label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/.../video.mp4"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setSelectedFile(null);
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              style={submitBtnStyle}
            >
              {uploading ? 'Uploading & Processing Video...' : '+ Add Hero Reel Video'}
            </button>
          </form>
        </section>

        {/* Reels List Section */}
        <section style={cardSectionStyle}>
          <div style={sectionHeaderFlexStyle}>
            <h2 style={sectionHeadingStyle}>Current Hero Reels ({reels.length})</h2>
            <span style={hintBadgeStyle}>Side-by-Side Reels format visible on Homepage</span>
          </div>

          {loading ? (
            <p style={loadingTextStyle}>Loading hero reels catalog...</p>
          ) : reels.length === 0 ? (
            <p style={emptyTextStyle}>No hero reels found. Upload your first video above!</p>
          ) : (
            <div style={reelsGridStyle}>
              {reels.map((reel, index) => (
                <div key={reel.id} style={reelCardStyle}>
                  <div style={videoWrapperStyle}>
                    <video
                      src={reel.video_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={videoPreviewStyle}
                    />
                    <span style={orderBadgeStyle}>#{index + 1}</span>
                  </div>

                  <div style={reelInfoStyle}>
                    <h3 style={reelTitleStyle}>{reel.title || `Hero Reel ${index + 1}`}</h3>
                    <p style={reelUrlStyle} title={reel.video_url}>
                      {reel.video_url.length > 35 ? reel.video_url.slice(0, 35) + '...' : reel.video_url}
                    </p>

                    <div style={actionsRowStyle}>
                      <div style={reorderBtnGroupStyle}>
                        <button
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          style={reorderBtnStyle}
                          title="Move Left/Up"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => handleMove(index, 1)}
                          disabled={index === reels.length - 1}
                          style={reorderBtnStyle}
                          title="Move Right/Down"
                        >
                          →
                        </button>
                      </div>

                      <button
                        onClick={() => handleDelete(reel.id)}
                        style={deleteBtnStyle}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#FAF5F6',
  color: '#000000',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const mainContentStyle = {
  flex: 1,
  padding: '2.5rem 3rem',
  overflowY: 'auto',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
};

const titleStyle = {
  fontSize: '1.8rem',
  fontFamily: 'var(--font-serif)',
  fontWeight: '600',
  color: '#000000',
  margin: 0,
};

const subtitleStyle = {
  fontSize: '0.88rem',
  color: 'rgba(0, 0, 0, 0.5)',
  margin: '0.3rem 0 0 0',
};

const logoutBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(0, 0, 0, 0.2)',
  color: '#000000',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '0.82rem',
};

const errorBannerStyle = {
  backgroundColor: '#FFF0F2',
  color: '#C53030',
  border: '1px solid #FEB2B2',
  padding: '0.8rem 1.2rem',
  borderRadius: '6px',
  marginBottom: '1.5rem',
  fontSize: '0.9rem',
};

const successBannerStyle = {
  backgroundColor: '#F0FFF4',
  color: '#276749',
  border: '1px solid #9AE6B4',
  padding: '0.8rem 1.2rem',
  borderRadius: '6px',
  marginBottom: '1.5rem',
  fontSize: '0.9rem',
};

const cardSectionStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.8rem',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
  marginBottom: '2.5rem',
  border: '1px solid rgba(0, 0, 0, 0.05)',
};

const sectionHeadingStyle = {
  fontSize: '1.2rem',
  fontWeight: '600',
  color: '#000000',
  margin: '0 0 1.2rem 0',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const labelStyle = {
  fontSize: '0.82rem',
  fontWeight: '600',
  color: 'rgba(0, 0, 0, 0.7)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle = {
  padding: '0.7rem 1rem',
  borderRadius: '6px',
  border: '1px solid rgba(0, 0, 0, 0.15)',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const dualUploadGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: '1rem',
  alignItems: 'center',
  backgroundColor: '#FAF7F8',
  padding: '1.2rem',
  borderRadius: '8px',
  border: '1px dashed rgba(0, 0, 0, 0.15)',
};

const uploadBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const fileInputStyle = {
  fontSize: '0.85rem',
};

const fileNoticeStyle = {
  fontSize: '0.78rem',
  color: '#D98E9B',
  fontWeight: '600',
  margin: 0,
};

const orDividerStyle = {
  fontSize: '0.8rem',
  fontWeight: '700',
  color: 'rgba(0, 0, 0, 0.3)',
};

const submitBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#FFFFFF',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  transition: 'opacity 0.2s ease',
};

const sectionHeaderFlexStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const hintBadgeStyle = {
  fontSize: '0.78rem',
  backgroundColor: '#F6DDE2',
  color: '#7A3F4C',
  padding: '0.3rem 0.7rem',
  borderRadius: '12px',
  fontWeight: '600',
};

const loadingTextStyle = {
  fontSize: '0.9rem',
  color: 'rgba(0, 0, 0, 0.5)',
  textAlign: 'center',
  padding: '2rem 0',
};

const emptyTextStyle = {
  fontSize: '0.9rem',
  color: 'rgba(0, 0, 0, 0.5)',
  textAlign: 'center',
  padding: '2rem 0',
};

const reelsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1.5rem',
};

const reelCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  flexDirection: 'column',
};

const videoWrapperStyle = {
  position: 'relative',
  aspectRatio: '9 / 16',
  backgroundColor: '#000000',
  overflow: 'hidden',
};

const videoPreviewStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const orderBadgeStyle = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: '#FFFFFF',
  fontSize: '0.75rem',
  fontWeight: '700',
  padding: '0.2rem 0.5rem',
  borderRadius: '12px',
  backdropFilter: 'blur(4px)',
};

const reelInfoStyle = {
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const reelTitleStyle = {
  fontSize: '0.92rem',
  fontWeight: '600',
  color: '#000000',
  margin: 0,
};

const reelUrlStyle = {
  fontSize: '0.75rem',
  color: 'rgba(0, 0, 0, 0.4)',
  margin: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const actionsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '0.5rem',
  paddingTop: '0.5rem',
  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
};

const reorderBtnGroupStyle = {
  display: 'flex',
  gap: '0.3rem',
};

const reorderBtnStyle = {
  backgroundColor: '#FAF5F6',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  color: '#000000',
  width: '28px',
  height: '28px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '0.85rem',
};

const deleteBtnStyle = {
  backgroundColor: '#FFF0F2',
  color: '#C53030',
  border: '1px solid #FEB2B2',
  padding: '0.3rem 0.7rem',
  borderRadius: '4px',
  fontSize: '0.78rem',
  fontWeight: '600',
  cursor: 'pointer',
};
