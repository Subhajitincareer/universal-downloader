from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import yt_dlp
import json

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        url_query = parse_qs(urlparse(self.path).query)
        video_url = url_query.get('url', [None])[0]

        if not video_url:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'URL parameter is required'}).encode('utf-8'))
            return

        ydl_opts = {
            'format': 'best',
            'quiet': True,
            'no_warnings': True,
            'skip_download': True
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(video_url, download=False)
                
                formats = []
                # Look for formats that have both video and audio, or fallback to video-only if necessary, but keep it simple
                for f in reversed(info_dict.get('formats', [])):
                    if f.get('vcodec') != 'none':
                        formats.append({
                            'formatId': f.get('format_id'),
                            'resolution': f.get('format_note') or f"{f.get('width', '')}x{f.get('height', '')}",
                            'ext': f.get('ext'),
                            'filesize': f.get('filesize') or f.get('filesize_approx') or 0,
                            'fps': f.get('fps'),
                            'directUrl': f.get('url')
                        })
                
                response_data = {
                    'title': info_dict.get('title', 'Unknown Title'),
                    'thumbnail': info_dict.get('thumbnail', ''),
                    'duration': info_dict.get('duration', 0),
                    'extractor': info_dict.get('extractor', 'unknown'),
                    'formats': formats
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Failed to fetch video info',
                'details': str(e)
            }).encode('utf-8'))
