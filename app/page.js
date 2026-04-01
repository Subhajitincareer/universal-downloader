'use client';

import { useState } from 'react';
import './globals.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState(null);

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



  const handleDownloadClick = (format) => {


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
      // Use resolution + hasAudio as key to differentiate between silent and voiced versions
      const resKey = `${f.resolution}-${f.hasAudio}`;
      if (!resMap.has(resKey)) {
        resMap.set(resKey, f);
      }
    });

    return Array.from(resMap.values()).sort((a, b) => (b.height || 0) - (a.height || 0));
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
              return (
                <button
                  key={idx}
                  className="format-btn"
                  onClick={() => handleDownloadClick(format)}
                  disabled={downloadingFormat === format.formatId}
                >
                  <div className="format-badges">
                    {format.hasVideo && format.hasAudio && <span className="badge combined">Video + Audio</span>}
                    {format.hasVideo && !format.hasAudio && <span className="badge video">Silent Video</span>}
                    {!format.hasVideo && format.hasAudio && <span className="badge audio">Audio Only</span>}
                  </div>

                  <span className="format-res">{format.resolution}</span>
                  <span className="format-ext">.{format.ext.toUpperCase()}</span>
                  <div className="format-meta">
                    {format.fps ? <span>{format.fps} FPS</span> : null}
                    {format.filesize ? (
                      <span>{(format.filesize / (1024 * 1024)).toFixed(1)} MB</span>
                    ) : null}
                  </div>
                  {downloadingFormat === format.formatId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '0.5rem' }}>Processing...</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}


    </main>
  );
}
