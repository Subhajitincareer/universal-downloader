import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

/**
 * Creates or resolves a path to a cookies.txt file to pass to yt-dlp.
 * Returns both the path and a cleanup function to immediately remove it after usage.
 *
 * @returns {Promise<{ cookiePath: string | null, cleanup: () => Promise<void> }>}
 */
export async function getCookiePath() {
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

    // Write to a securely named temp file so yt-dlp can read it
    const tmpFile = path.join(os.tmpdir(), `yt_cookies_${crypto.randomUUID()}.txt`);
    await fs.writeFile(tmpFile, cookieContent, { mode: 0o600 });
    
    console.log('Using cookies from YOUTUBE_COOKIES environment variable. Temp file created.');
    
    return {
      cookiePath: tmpFile,
      cleanup: async () => {
        try {
          await fs.unlink(tmpFile);
          console.log(`Cleaned up temp cookie file ${tmpFile}`);
        } catch (err) {
          // Ignore if already deleted
        }
      }
    };
  }

  // 2. Fallback to local cookies.txt file
  const localCookiePath = path.resolve(process.cwd(), 'cookies.txt');
  if (existsSync(localCookiePath)) {
    console.log('Using local cookies.txt file:', localCookiePath);
    // For local dev, no cleanup needed
    return {
      cookiePath: 'cookies.txt',
      cleanup: async () => {} 
    };
  }

  console.warn('WARNING: No cookies found. YouTube bot detection may block requests on datacenter IPs.');
  return { cookiePath: null, cleanup: async () => {} };
}
