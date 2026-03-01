import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Fetch video metadata, formats, and other details using yt-dlp through the wrapper
    const output = await youtubedl(url, {
      dumpJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    // Parse the relevant formats from the output
    // Filter out formats that don't have video (audio only) unless it's strictly needed, 
    // but for universally downloading formats, we want combinations or pre-merged formats
    const formats = output.formats
      .filter((f) => f.vcodec !== 'none') // Ensure it has video
      .map((f) => ({
        formatId: f.format_id,
        resolution: f.resolution || `${f.width}x${f.height}`,
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx,
        fps: f.fps,
        formatNote: f.format_note,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url // the direct URL if they want to stream it directly
      }))
      .reverse(); // Generally best qualities are at the end

    return NextResponse.json({
      title: output.title,
      thumbnail: output.thumbnail,
      duration: output.duration,
      extractor: output.extractor,
      formats: formats,
    });
  } catch (error) {
    console.error('Error fetching info:', error);
    return NextResponse.json({ error: 'Failed to fetch video info. Please verify the URL.' }, { status: 500 });
  }
}
