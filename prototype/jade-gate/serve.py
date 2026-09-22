#!/usr/bin/env python3
"""Serve only this game directory on the loopback interface."""
import http.server
import os
import sys
import webbrowser
from pathlib import Path
os.chdir(Path(__file__).resolve().parent)
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
try:
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), Handler)
except OSError as exc:
    print('Could not start on port 8765. If the game is already running, open http://127.0.0.1:8765', flush=True)
    raise SystemExit(str(exc))
print('Blades of the Four: http://127.0.0.1:8765 — Ctrl+C to stop', flush=True)
if '--open' in sys.argv:
    webbrowser.open('http://127.0.0.1:8765')
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
