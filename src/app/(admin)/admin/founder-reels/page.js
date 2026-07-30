'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminFounderReelsPage() {
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

  const isMaxReached = reels.length >= 3;

  const fetchReels = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/founder-reels');
      if (!res.ok) throw new Error('Failed to fetch founder reels.');
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
    if (isMaxReached) {
      setError('Maximum 3 reels allowed');
      return;
    }

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
        formData.append('title', title.trim() || 'Founder Reel');
        
        res = await fetch('/api/admin/founder-reels', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/founder-reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url: videoUrl.trim(),
            title: title.trim() || 'Founder Reel',
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add reel.');

      setSuccess('Founder reel added successfully!');
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
      const res = await fetch('/api/admin/founder-reels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reels: newReels }),
      });
      if (!res.ok) throw new Error('Failed to update sort order.');
    } catch (err) {
      console.error(err);
      setError('Failed to save reordered reels.');
      fetchReels();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this founder reel?')) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/founder-reels?id=${id}`, {
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
      <AdminSidebar active="founder-reels" />

      <main style={mainContentStyle} className="admin-main">
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Founder Reels Management</h1>
            <p style={subtitleStyle}>Upload, reorder, and manage the 3-reel row in the About Founder section</p>
          </div>
          <button onClick={logout} style={logoutBtnStyle} className="admin-btn">
            Sign Out
          </button>
        </header>

        {error && <div style={errorBannerStyle}>{error}</div>}
        {success && <div style={successBannerStyle}>{success}</div>}

        {/* Upload Card */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Upload New Founder Reel</h2>
          
          {isMaxReached ? (
            <div style={maxNoticeStyle}>
              <strong>Maximum 3 reels allowed.</strong> Delete an existing reel to upload a new one.
            </div>
          ) : (
            <form onSubmit={handleAddReel} style={formStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Reel Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Founder Reel 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                  disabled={uploading || isMaxReached}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Option A: Upload Video File (MP4, WEBM)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  style={fileInputStyle}
                  disabled={uploading || isMaxReached}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Option B: Direct Video URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={inputStyle}
                  disabled={uploading || isMaxReached || !!selectedFile}
                />
              </div>

              <button
                type="submit"
                style={{
                  ...submitBtnStyle,
                  opacity: (uploading || isMaxReached) ? 0.6 : 1,
                  cursor: (uploading || isMaxReached) ? 'not-allowed' : 'pointer'
                }}
                disabled={uploading || isMaxReached}
              >
                {uploading ? 'Uploading Video...' : 'Add Founder Reel'}
              </button>
            </form>
          )}
        </div>

        {/* Existing Founder Reels Grid / List */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={cardTitleStyle}>Active Founder Reels ({reels.length} / 3)</h2>
            <span style={{ fontSize: '0.85rem', color: reels.length === 3 ? '#2E7D32' : '#B97285', fontWeight: '600' }}>
              {reels.length === 3 ? '✓ 3 Reels Set' : `${reels.length} of 3 reels added`}
            </span>
          </div>

          {loading ? (
            <p style={{ color: '#666' }}>Loading founder reels...</p>
          ) : reels.length === 0 ? (
            <p style={{ color: '#666' }}>No founder reels uploaded yet.</p>
          ) : (
            <div style={reelsGridStyle}>
              {reels.map((reel, index) => (
                <div key={reel.id} style={reelCardStyle}>
                  <div style={reelHeaderStyle}>
                    <span style={badgeStyle}>#{index + 1}</span>
                    <span style={reelTitleStyle}>{reel.title || `Founder Reel ${index + 1}`}</span>
                  </div>

                  <div style={videoPreviewWrapperStyle}>
                    <video
                      src={reel.video_url}
                      muted
                      loop
                      playsInline
                      style={videoPreviewStyle}
                      onMouseOver={(e) => e.target.play()}
                      onMouseOut={(e) => e.target.pause()}
                    />
                  </div>

                  <div style={actionsRowStyle}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        style={{ ...actionBtnStyle, opacity: index === 0 ? 0.4 : 1 }}
                        title="Move Up/Left"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => handleMove(index, 1)}
                        disabled={index === reels.length - 1}
                        style={{ ...actionBtnStyle, opacity: index === reels.length - 1 ? 0.4 : 1 }}
                        title="Move Down/Right"
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Inline Styles matching Admin Portal UI
const containerStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#F9F6F3',
};

const mainContentStyle = {
  flex: 1,
  padding: '2.5rem',
  maxWidth: '1200px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
};

const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2rem',
  color: '#2D2429',
  fontWeight: '600',
};

const subtitleStyle = {
  color: '#666',
  fontSize: '0.9rem',
  marginTop: '0.2rem',
};

const logoutBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid #D98E9B',
  color: '#D98E9B',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.85rem',
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.8rem',
  marginBottom: '2rem',
  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
};

const cardTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: '600',
  color: '#2D2429',
  marginBottom: '1.2rem',
};

const maxNoticeStyle = {
  backgroundColor: '#FFF5F7',
  border: '1px solid #F3C5CE',
  color: '#B97285',
  padding: '1rem 1.2rem',
  borderRadius: '8px',
  fontSize: '0.9rem',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  maxWidth: '600px',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const labelStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#444',
};

const inputStyle = {
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #E2D9D5',
  fontSize: '0.9rem',
  outline: 'none',
};

const fileInputStyle = {
  fontSize: '0.85rem',
  color: '#555',
};

const submitBtnStyle = {
  backgroundColor: '#B97285',
  color: '#FFFFFF',
  border: 'none',
  padding: '0.85rem 1.5rem',
  borderRadius: '8px',
  fontWeight: '700',
  fontSize: '0.88rem',
  letterSpacing: '0.05em',
  alignSelf: 'flex-start',
  marginTop: '0.5rem',
};

const errorBannerStyle = {
  backgroundColor: '#FDF2F2',
  color: '#9B1C1C',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  fontSize: '0.9rem',
  fontWeight: '600',
};

const successBannerStyle = {
  backgroundColor: '#F0FDF4',
  color: '#15803D',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  fontSize: '0.9rem',
  fontWeight: '600',
};

const reelsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1.5rem',
};

const reelCardStyle = {
  border: '1px solid #E2D9D5',
  borderRadius: '12px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  backgroundColor: '#FAFAFA',
};

const reelHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
};

const badgeStyle = {
  backgroundColor: '#B97285',
  color: '#FFFFFF',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: '700',
};

const reelTitleStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#2D2429',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const videoPreviewWrapperStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '9/16',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#000',
};

const videoPreviewStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  cursor: 'pointer',
};

const actionsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const actionBtnStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2D9D5',
  color: '#2D2429',
  borderRadius: '6px',
  padding: '0.4rem 0.8rem',
  fontSize: '0.85rem',
  fontWeight: '700',
  cursor: 'pointer',
};

const deleteBtnStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#9B1C1C',
  fontSize: '0.82rem',
  fontWeight: '600',
  cursor: 'pointer',
  textDecoration: 'underline',
};
