import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import { getCookiePath } from '../_utils/cookies.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const formatId = searchParams.get('formatId');
  const title = searchParams.get('title') || 'video';
  const ext = searchParams.get('ext') || 'mp4';

  if (!url || !formatId) {
    return NextResponse.json({ error: 'URL and formatId parameters are required' }, { status: 400 });
  }

  const cookiePath = getCookiePath();

  const options = {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificate: true,
    extractorArgs: "youtube:player_client=ios,web,android",
    format: formatId
  };

  if (cookiePath) {
    options.cookies = cookiePath;
  }

  try {
    // 1. Get the authenticated direct CDN URL for this specific format
    const output = await youtubedl(url, options);
    const directUrl = output.url;

    if (!directUrl) {
      throw new Error("Failed to extract direct download URL from yt-dlp");
    }

    // 2. Stream the file from CDN through our server to bypass CORS/IP issues
    const response = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(request.headers.get('range') && { 'Range': request.headers.get('range') })
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream CDN returned ${response.status} ${response.statusText}`);
    }

    // 3. Forward the stream to the browser with download headers
    const headers = new Headers(response.headers);
    const safeTitle = title.replace(/[^a-zA-Z0-9_\-\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF ]/g, '_').trim();
    
    headers.set('Content-Disposition', `attachment; filename="${safeTitle}.${ext}"`);
    headers.set('Content-Type', 'application/octet-stream');
    headers.delete('content-encoding');
    
    return new NextResponse(response.body, { 
      status: response.status,
      statusText: response.statusText,
      headers 
    });

  } catch (error) {
    console.error('Proxy Download Error:', error.message || error);
    return NextResponse.json({ error: 'Failed to start download stream', details: error.message }, { status: 500 });
  }
}
