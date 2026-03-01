import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const formatId = searchParams.get('formatId') || 'best'; // Default to best if missing

  if (!url) {
    return new Response('URL parameter is required', { status: 400 });
  }

  try {
    // We execute yt-dlp to output the stream to stdout (-o -) and we capture it
    const subprocess = youtubedl.exec(url, {
      format: formatId,
      output: '-', // Important: output to stdout
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
    });

    // Create a readable stream from the subprocess stdout
    const stream = new ReadableStream({
      start(controller) {
        subprocess.stdout.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        subprocess.stdout.on('end', () => {
          controller.close();
        });
        subprocess.stdout.on('error', (err) => {
          console.error('Subprocess stdout error:', err);
          controller.error(err);
        });
        
        subprocess.on('error', (err) => {
           console.error('Subprocess execution error:', err);
           controller.error(err);
        });
      },
      cancel() {
        subprocess.kill();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Disposition': 'attachment; filename="downloaded_video.mp4"',
        'Content-Type': 'video/mp4', // Simplification, could be dynamically set
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new Response('Failed to download video', { status: 500 });
  }
}
