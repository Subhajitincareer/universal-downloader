const youtubedl = require('youtube-dl-exec');

async function test() {
  try {
    console.log('Fetching info...');
    const output = await youtubedl('https://www.youtube.com/watch?v=aqz-KE-bpKQ', {
      dumpJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });
    console.log('Title:', output.title);
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
