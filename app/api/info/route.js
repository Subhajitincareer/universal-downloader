import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Escape space issue in path because of 'cloning project' folder name
    // passing the path relative to CWD avoids full absolute path spacing errors
    const cookiePath = 'cookies.txt';
    const hasCookies = fs.existsSync(path.resolve(process.cwd(), cookiePath));
    
    console.log("========== SERVER COOKIE DEBUG ==========");
    console.log("Process CWD:", process.cwd());
    console.log("Looking for cookies at:", cookiePath);
    console.log("File exists:", hasCookies);
    if(hasCookies) {
        console.log("File size:", fs.statSync(cookiePath).size, "bytes");
    }
    console.log("=========================================");

    // Crucial Update: YouTube is aggressively blocking Datacenter IPs. 
    // We MUST use the web client bypasses if cookies aren't present.
    const options = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      // Pass multiple clients: web-creator prevents age-gate, ios prevents bot-gate
      extractorArgs: "youtube:player_client=ios,web,android"
    };

    if (hasCookies) {
      // Need to stringify the path to avoid backslash escaping issues on Windows
      options.cookies = cookiePath;
      console.log("Attached cookies to yt-dlp arguments.");
    } else {
      console.log("WARNING: NO COOKIES FOUND. Relying on client spoofing.");
    }

    console.log("Executing yt-dlp...");
    const output = await youtubedl(url, options);
    console.log("YT-DLP execution successful!");

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
    console.error('Final yt-dlp Error:', error.message);
    
    // Send a beautifully formatted error message to the client frontend
    const isBotError = error.message.includes('Sign in to confirm');
    
    return NextResponse.json({ 
      error: isBotError ? "YouTube Bot Protection Active. The server administrator must upload a cookies.txt file to the server root." : "Failed to extract video info.", 
      details: error.message || String(error),
      requiresAuth: isBotError
    }, { status: 500 });
  }
}
