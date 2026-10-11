import json, os
D = os.path.dirname(os.path.abspath(__file__)) + os.sep
head = open(D + 'src/head.html').read()
parts = [head] + [open(D + 'src/' + f).read() for f in [
    'helpers_a.js', 'beat_tracks.js', 'beat_fx.js', 'beat_render.js',
    'new1.js', 'new2.js', 'new3.js', 'new4.js', 'new5.js']]
out = '\n'.join(parts).replace('%META%', json.dumps(json.load(open(D + 'assets/sprites/meta.json'))))
open(D + 'index.html', 'w').write(out)
