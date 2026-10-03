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

test('editorial cuts cover the film and bring a face into view at each narration entrance', async () => {
  const { TRAILER_CUTS } = await import('../src/content/trailer.js');
  let end = 0;
  for (const shot of TRAILER_CUTS) {
    assert.equal(shot.start, end);
    assert.ok(shot.end > shot.start);
    assert.equal(trailerFrame(shot.start).shot.id, shot.id);
    if (shot.focus) assert.ok(readFileSync(new URL(`../assets/${shot.focus}.png`, import.meta.url)).length > 0);
    end = shot.end;
  }
  assert.equal(end, TRAILER_DURATION);
  for (const cue of TRAILER_VOICE) assert.ok(trailerFrame(cue.start).shot.focus, cue.file);
  assert.equal(trailerFrame(10).shot.id, 'reveal');
});

test('contact poses hold at the shared sound cue and replay samples the same motion', async () => {
  const { TRAILER_IMPACTS } = await import('../src/content/trailer.js');
  for (const [index, hit] of TRAILER_IMPACTS.entries()) {
    const contact = trailerFrame(hit.at);
    assert.equal(contact.pose, index ? 'special' : 'strike');
    assert.equal(contact.effects.travel, 1);
    assert.equal(trailerFrame(hit.at + .04).effects.travel, 1);
    assert.ok(contact.effects.flash > 0);
    assert.ok(contact.effects.ringOpacity > 0);
    assert.deepEqual(trailerFrame(hit.at), contact);
  }
  assert.equal(trailerFrame(5.7).pose, 'focus');
  assert.ok(trailerFrame(5.7).effects.energy > 0);
  assert.equal(trailerFrame(6.5).effects.travel, 0);
  assert.equal(trailerFrame(6.5).effects.flash, 0);
});

test('reduced motion retains every scene and subtitle while disabling all camera/impact effects', () => {
  for (let t = 0; t <= 10; t += .02) {
    const normal = trailerFrame(t), reduced = trailerFrame(t, true);
    assert.equal(reduced.scene, normal.scene);
    assert.equal(reduced.voice, normal.voice);
    assert.ok(Object.values(reduced.effects).every(value => value === 0));
  }
});
