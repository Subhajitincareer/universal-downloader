import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // using youtube-dl-exec to extract standard format info natively in a Dockerized environment
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      extractorArgs: "youtube:player_client=ios" // Add the bot bypass here too just in case!
    });

    const formats = output.formats
      .filter((f) => f.vcodec !== 'none') // Ensure it has video
      .map((f) => ({
        formatId: f.format_id,
        resolution: f.format_note || `${f.width}x${f.height}`,
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx,
        fps: f.fps,
        formatNote: f.format_note,
        vcodec: f.vcodec,
        acodec: f.acodec,
        directUrl: f.url // Send the direct CDN URL to the client
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
    console.error('Error fetching info:', error.message);
    if (error.stderr) console.error('stderr:', error.stderr);
    
    return NextResponse.json({ 
      error: 'Failed to fetch video info. Please verify the URL.', 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
