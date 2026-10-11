import sys,os,http.server,threading,functools
from playwright.sync_api import sync_playwright
D=os.path.dirname(os.path.abspath(__file__))
out=sys.argv[1];arg=sys.argv[2] if len(sys.argv)>2 else '0-719'
frames=[int(x) for x in arg.split(',')] if '-' not in arg else range(int(arg.split('-')[0]),int(arg.split('-')[1])+1)
os.makedirs(out,exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(*a):pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Q,directory=D));threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--hide-scrollbars'])
    pg=b.new_page(viewport={'width':1920,'height':1080})
    pg.on('console',lambda m:print('console',m.text)); pg.on('pageerror',lambda e:print('ERR',e))
    pg.goto('http://127.0.0.1:%d/index.html?manual=1'%srv.server_address[1]);pg.wait_for_function('window.__ready===true',timeout=30000)
    for f in frames:
        pg.evaluate(f'window.__render({f})')
        pg.locator('#c').screenshot(path=f'{out}/f{f:03d}.png')
    b.close()
