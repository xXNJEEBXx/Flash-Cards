import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

class SPARequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Resolve path
        path = self.translate_path(self.path)
        # If path doesn't exist or is a directory without index.html
        if not os.path.exists(path) or os.path.isdir(path):
            if not (os.path.isdir(path) and os.path.exists(os.path.join(path, 'index.html'))):
                self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    build_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'flash-cards', 'build'))
    os.chdir(build_dir)
    server = HTTPServer(('0.0.0.0', port), SPARequestHandler)
    print(f"SPA Server running at http://localhost:{port} serving {build_dir}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
