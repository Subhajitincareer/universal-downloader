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
      .map((f) => {
        const hasVideo = f.vcodec !== 'none';
        const hasAudio = f.acodec !== 'none';
        const height = f.height || (f.resolution ? parseInt(f.resolution.split('x')[1]) : 0);
        
        let label = '';
        if (height >= 2160) label = '4K Ultra HD';
        else if (height >= 1440) label = '2K Quad HD';
        else if (height >= 1080) label = '1080p Full HD';
        else if (height >= 720) label = '720p HD';
        else if (height >= 480) label = '480p SD';
        else if (height >= 360) label = '360p';
        else if (height > 0) label = `${height}p`;
        else if (!hasVideo && hasAudio) label = 'High Quality Audio';

        return {
          formatId: f.format_id,
          resolution: label || f.format_note || `${f.width}x${f.height}`,
          height: height,
          ext: f.ext,
          filesize: f.filesize || f.filesize_approx,
          fps: f.fps,
          hasVideo: hasVideo,
          hasAudio: hasAudio,
          vcodec: f.vcodec,
          acodec: f.acodec,
        };
      })
      .sort((a, b) => (b.height || 0) - (a.height || 0));

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
