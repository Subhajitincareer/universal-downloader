'use client';

import { useState } from 'react';
import './globals.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [showProModal, setShowProModal] = useState(false); // Modal state for Freemium

  const fetchInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    setError('');
    setLoading(true);
    setVideoInfo(null);

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch video information.');
      }

      setVideoInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isProFormat = (format) => {
    // If it's a high resolution or high framerate, flag it as PRO
    if (!format.resolution) return false;
    const resValue = parseInt(format.resolution.split('x')[1]); // get height
    return resValue >= 1080 || format.fps >= 60;
  };

  const handleDownloadClick = (format) => {
    if (isProFormat(format)) {
      // Trigger Freemium Gating Modal instead of downloading
      setShowProModal(true);
      return;
    }

    // Proxy Download Logic (Pipes through our Next.js server to bypass 403 IP mismatch)
    setDownloadingFormat(format.formatId);
    
    // Hit our proxy API endpoint which streams the download securely
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&formatId=${format.formatId}&title=${encodeURIComponent(videoInfo?.title || 'video')}&ext=${format.ext}`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${videoInfo?.title || 'video'}.${format.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloadingFormat(null);
    }, 2000);
  };

  const getCleanFormats = (formats) => {
    if (!formats) return [];
    
    const resMap = new Map();
    formats.forEach(f => {
      const resKey = f.resolution;
      if (!resMap.has(resKey)) {
        resMap.set(resKey, f);
      }
    });

    return Array.from(resMap.values());
  };

  return (
    <main className="container">
      {/* 1. Buy Me A Coffee Header Support Button */}
      <nav className="top-nav">
        <a 
          href="https://buymeacoffee.com/yourusername" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="support-btn"
        >
          <span>☕</span> Support the Developer
        </a>
      </nav>

      <div className="header">
        <h1 className="title">Universal Downloader</h1>
        <p className="subtitle">Download flawlessly from YouTube, Instagram, Facebook, TikTok, X, and more.</p>
      </div>

      <div className="input-section">
        <input 
          type="url" 
          className="url-input" 
          placeholder="Paste YouTube, Instagram, TikTok, Facebook URL here..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
        />
        <button 
          className="fetch-btn" 
          onClick={fetchInfo}
          disabled={loading || !url.trim()}
        >
          {loading ? 'Processing...' : 'Fetch Video'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* 2. Ethical Display Ad / Affiliate Banner Placeholder */}
      <a href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=custom" target="_blank" rel="noopener noreferrer" className="ad-container">
        <img src="https://via.placeholder.com/130x100/1e1b4b/6366f1?text=VPN+Ad" alt="Sponsored VPN" className="ad-image" />
        <div className="ad-content">
          <span className="ad-title">Protect Your Downloads</span>
          <span className="ad-desc">Your ISP can see what you download. Hide your activity and unblock any video worldwide with our recommended VPN. Click for 60% off.</span>
          <span className="ad-badge">Sponsored Resource</span>
        </div>
      </a>

      {loading && (
        <div className="center-content">
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Extracting video magic...</p>
        </div>
      )}

      {videoInfo && (
        <div className="result-card">
          <div className="video-info">
            <div className="thumbnail-container">
              <img src={videoInfo.thumbnail} alt="Thumbnail" className="thumbnail" />
            </div>
            <div className="details">
              <span className="platform-badge">{videoInfo.extractor}</span>
              <h2 className="video-title">{videoInfo.title}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                {videoInfo.duration ? `Duration: ${Math.floor(videoInfo.duration / 60)}:${(videoInfo.duration % 60).toString().padStart(2, '0')}` : ''}
              </p>
            </div>
          </div>

          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            Available Qualities
          </h3>
          
          <div className="formats-list">
            {getCleanFormats(videoInfo.formats).map((format, idx) => {
              const checkPro = isProFormat(format);
              return (
                <button 
                  key={idx} 
                  className={`format-btn ${checkPro ? 'pro' : ''}`}
                  onClick={() => handleDownloadClick(format)}
                  disabled={downloadingFormat === format.formatId}
                >
                  {/* 3. Freemium Pro Badge UI */}
                  {checkPro && <span className="pro-badge">PRO</span>}
                  
                  <span className={`format-res ${checkPro ? 'pro-text' : ''}`}>{format.resolution}</span>
                  <span className="format-ext">.{format.ext} {format.vcodec !== 'none' ? 'Video' : 'Audio'}</span>
                  {format.filesize ? (
                    <span style={{fontSize: '0.75rem', opacity: 0.7}}>
                      {(format.filesize / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  ) : null}
                  {downloadingFormat === format.formatId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>Starting...</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Freemium Upgrade Modal */}
      {showProModal && (
        <div className="modal-overlay" onClick={() => setShowProModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProModal(false)}>&times;</button>
            <div className="premium-icon">👑</div>
            <h2 className="modal-title">Unlock Premium Quality</h2>
            <p className="modal-desc">
              Downloading 4K and 60FPS video files consumes massive server bandwidth. Get the <strong>PRO Pass</strong> to unlock maximum quality formats permanently and support the developer!
            </p>
            <button className="upgrade-btn" onClick={() => alert('This would redirect to Stripe Checkout!')}>
              Upgrade to PRO for $4.99
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
