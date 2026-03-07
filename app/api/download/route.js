import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const formatId = searchParams.get('formatId');
  const title = searchParams.get('title') || 'video';
  const ext = searchParams.get('ext') || 'mp4';

  if (!url || !formatId) {
    return NextResponse.json({ error: 'URL and formatId parameters are required' }, { status: 400 });
  }

  // yt-dlp needs forward slashes even on Windows for the cookie path to work reliably
  const cookiePath = 'cookies.txt';
  const hasCookies = fs.existsSync(path.resolve(process.cwd(), cookiePath));

  const options = {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificate: true,
    extractorArgs: "youtube:player_client=ios,web,android",
    format: formatId
  };

  if (hasCookies) {
    options.cookies = cookiePath;
  }

  try {
    // 1. First extract the direct CDN URL for this specific format
    const output = await youtubedl(url, options);
    
    // Fallback safely to output.url directly since format=formatId forces a single format stream dump
    const directUrl = output.url; 

    if (!directUrl) {
       throw new Error("Failed to extract direct download URL from yt-dlp");
    }

    // 2. Stream the file from the direct CDN URL through our Next.js server to the client
    const response = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Pass along range headers if the client requests them (for resumable downloads)
        ...(request.headers.get('range') && { 'Range': request.headers.get('range') })
      }
    });

    if (!response.ok) {
       throw new Error(`Upstream CDN returned ${response.status} ${response.statusText}`);
    }

    // 3. Prepare headers for the client browser to trigger a "Save As" dialogue
    const headers = new Headers(response.headers);
    const safeTitle = title.replace(/[^a-zA-Z0-9_\-\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF ]/g, '_').trim();
    
    headers.set('Content-Disposition', `attachment; filename="${safeTitle}.${ext}"`);
    // Ensure we send standard octet-stream so the browser downloads it instead of trying to play it inline
    headers.set('Content-Type', 'application/octet-stream');
    
    // Crucial: remove headers from the CDN that might interfere with our proxy response
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
