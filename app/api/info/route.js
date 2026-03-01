import { NextResponse } from 'next/server';
import { ndown } from 'nayan-media-downloaders';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    let formats = [];
    let title = "Universal Video";
    let thumbnail = "";
    let duration = 0;
    
    // YOUTUBE HANDLER
    if (url.includes('youtu.be') || url.includes('youtube.com')) {
      const ytdl = require('@distube/ytdl-core');
      const info = await ytdl.getInfo(url);
      title = info.videoDetails.title;
      thumbnail = info.videoDetails.thumbnails[0]?.url || "";
      duration = parseInt(info.videoDetails.lengthSeconds);
      
      formats = info.formats
        .filter(f => f.hasVideo && f.hasAudio) // For simplicity, grab pre-muxed streams
        .map(f => ({
          formatId: f.itag.toString(),
          ext: f.container,
          resolution: f.qualityLabel || 'Standard',
          filesize: f.contentLength || 0,
          fps: f.fps || 30,
          vcodec: f.videoCodec,
          acodec: f.audioCodec,
          directUrl: f.url
        }));
    } else {
      // INSTAGRAM, FACEBOOK, TIKTOK, TWITTER HANDLER
      const socialData = await ndown(url);
      if(!socialData.status || !socialData.data) {
          throw new Error("Could not parse social media URL.");
      }
      title = socialData.data[0]?.title || "Social Media Video";
      thumbnail = socialData.data[0]?.thumbnail || "";
      
      formats = socialData.data.map((f, index) => ({
        formatId: `social-${index}`,
        ext: 'mp4',
        resolution: f.resolution || 'HD',
        filesize: 0,
        fps: 30,
        directUrl: f.url
      }));
    }

    return NextResponse.json({
      title,
      thumbnail,
      duration,
      extractor: 'pure-js-engine',
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
