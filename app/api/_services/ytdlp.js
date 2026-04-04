import { spawn } from 'child_process';

/**
 * Executes yt-dlp manually to avoid youtube-dl-exec buffering issues
 * and to parse errors correctly for bot detection.
 * 
 * @param {string[]} args Array of arguments to pass to yt-dlp
 * @returns {Promise<string>} The standard output (stdout)
 */
export function execYtDlp(args) {
  return new Promise((resolve, reject) => {
    // We enforce native output newline rendering so stream parsing is cleaner
    const ytdlp = spawn('yt-dlp', [...args]);

    let stdoutChunks = [];
    let stderrChunks = [];

    ytdlp.stdout.on('data', (data) => {
      stdoutChunks.push(data);
    });

    ytdlp.stderr.on('data', (data) => {
      // Log as we go for better observability
      const errChunk = data.toString();
      stderrChunks.push(errChunk);
      
      // Specifically catch YouTube bot detection to fail fast
      if (errChunk.includes('Sign in to confirm')) {
        ytdlp.kill('SIGKILL');
        reject(new Error('BOT_DETECTED'));
      }
    });

    ytdlp.on('close', (code) => {
      const output = Buffer.concat(stdoutChunks).toString('utf-8').trim();
      const errOutput = stderrChunks.join('').trim();

      if (code === 0) {
        resolve(output);
      } else {
        const err = new Error(errOutput || `yt-dlp exited with code ${code}`);
        err.code = code;
        reject(err);
      }
    });

    ytdlp.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Convenience wrapper to fetch JSON info for a video.
 */
export async function getInfo(url, cookiePath) {
  const args = [
    '--dump-single-json',
    '--no-warnings',
    '--no-check-certificate',
    '--extractor-args', 'youtube:player_client=ios,web,android',
    url
  ];

  if (cookiePath) {
    args.unshift('--cookies', cookiePath);
  }

  const rawJson = await execYtDlp(args);
  return JSON.parse(rawJson);
}

/**
 * Convenience wrapper to fetch the direct CDN url for a specific format.
 */
export async function getDirectUrl(url, formatId, cookiePath) {
  const args = [
    '--get-url',
    '-f', formatId,
    '--no-warnings',
    '--no-check-certificate',
    '--extractor-args', 'youtube:player_client=ios,web,android',
    url
  ];

  if (cookiePath) {
    args.unshift('--cookies', cookiePath);
  }

  const directUrl = await execYtDlp(args);
  return directUrl;
}
