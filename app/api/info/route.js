import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import { getCookiePath } from '../_utils/cookies.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const cookiePath = getCookiePath();

    const options = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      extractorArgs: "youtube:player_client=ios,web,android"
    };

    if (cookiePath) {
      options.cookies = cookiePath;
    }

    const output = await youtubedl(url, options);

    const formats = output.formats
      .filter((f) => f.vcodec !== 'none')
      .map((f) => ({
        formatId: f.format_id,
        resolution: f.format_note || `${f.width}x${f.height}`,
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx,
        fps: f.fps,
        formatNote: f.format_note,
        vcodec: f.vcodec,
        acodec: f.acodec,
        directUrl: f.url
      }))
      .reverse();

    return NextResponse.json({
      title: output.title,
      thumbnail: output.thumbnail,
      duration: output.duration,
      extractor: output.extractor,
      formats: formats,
    });
  } catch (error) {
    console.error('yt-dlp Error:', error.message);
    
    const isBotError = error.message?.includes('Sign in to confirm');
    
    return NextResponse.json({ 
      error: isBotError 
        ? "YouTube Bot Protection Active. Set the YOUTUBE_COOKIES environment variable in your Vercel dashboard." 
        : "Failed to fetch video info", 
      details: error.message || String(error),
      requiresAuth: isBotError
    }, { status: 500 });
  }
}
