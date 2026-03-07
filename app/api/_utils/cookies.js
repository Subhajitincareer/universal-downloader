import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Resolves a path to a cookies.txt file to pass to yt-dlp.
 * Priority order:
 * 1. YOUTUBE_COOKIES environment variable (base64 or raw text) — used on Vercel
 * 2. Local cookies.txt file in the project root — used in local development
 *
 * @returns {string|null} Absolute path to a temp cookies file, or null if no cookies are available.
 */
export function getCookiePath() {
  // 1. Check for the environment variable (set in Vercel dashboard)
  const cookiesEnv = process.env.YOUTUBE_COOKIES;
  if (cookiesEnv) {
    let cookieContent = cookiesEnv;

    // Support both raw text and base64-encoded cookies
    try {
      const decoded = Buffer.from(cookiesEnv, 'base64').toString('utf-8');
      // If it decodes and looks like a Netscape cookie file, use decoded version
      if (decoded.includes('# Netscape') || decoded.includes('.youtube.com')) {
        cookieContent = decoded;
      }
    } catch {
      // Not base64 - use raw content as-is
    }

    // Write to a temp file so yt-dlp can read it
    const tmpFile = path.join(os.tmpdir(), `yt_cookies_${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, cookieContent, 'utf-8');
    console.log('Using cookies from YOUTUBE_COOKIES environment variable. Temp file:', tmpFile);
    return tmpFile;
  }

  // 2. Fallback to local cookies.txt file
  const localCookiePath = path.resolve(process.cwd(), 'cookies.txt');
  if (fs.existsSync(localCookiePath)) {
    console.log('Using local cookies.txt file:', localCookiePath);
    // For local dev, use a relative path to avoid Windows path-spacing issues
    return 'cookies.txt';
  }

  console.warn('WARNING: No cookies found. YouTube bot detection may block requests on datacenter IPs.');
  return null;
}
