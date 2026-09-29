import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRAILER_DURATION, TRAILER_SCENES, TRAILER_VOICE, trailerFrame } from '../src/content/trailer.js';

test('trailer fills exactly ten seconds and switches scenes at each cut', () => {
  assert.equal(TRAILER_DURATION,10);
  let end = 0;
  for (const scene of TRAILER_SCENES) {
    assert.equal(scene.start,end);
    assert.ok(scene.end > scene.start);
    assert.equal(trailerFrame(scene.start).scene.id,scene.id);
    assert.equal(trailerFrame(scene.end - .001).scene.id,scene.id);
    end = scene.end;
  }
  assert.equal(end,10);
  assert.equal(trailerFrame(-1).time,0);
  assert.equal(trailerFrame(10).ended,true);
  assert.equal(trailerFrame(100).time,10);
  assert.equal(trailerFrame(NaN).time,0);
});
test('both narration tracks have real PCM audio and fit their non-overlapping cue windows', () => {
  let end=0;
  for (const cue of TRAILER_VOICE) {
    assert.ok(cue.start >= end && cue.end <= TRAILER_DURATION);
    assert.equal(trailerFrame(cue.start).voice,cue);
    end=cue.end;
    for (const language of ['ja','en']) {
      const wav = readFileSync(new URL(`../assets/trailer/${language}-${cue.file}.wav`,import.meta.url));
      assert.equal(wav.toString('ascii',0,4),'RIFF');
      assert.equal(wav.toString('ascii',8,12),'WAVE');
      let bytes=0,rate=0;
      for(let offset=12;offset+8<wav.length;) {
        const id=wav.toString('ascii',offset,offset+4), size=wav.readUInt32LE(offset+4);
        if(id==='fmt ') rate=wav.readUInt32LE(offset+16);
        if(id==='data') bytes=size;
        offset += 8 + size + (size%2);
      }
      const duration=bytes/rate;
      assert.ok(duration > .2 && duration / (cue.end-cue.start) < 1.5, `${language}-${cue.file}: ${duration}s needs excessive speed-up`);
      assert.ok(cue[language]);
    }
  }
});
