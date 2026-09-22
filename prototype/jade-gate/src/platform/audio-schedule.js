/** Discard missed music beats after throttling/muting; never replay an unbounded backlog. */
export function scheduleWindow(
  next,
  now,
  stepDuration,
  lookahead = 0.12,
  maxNotes = 8,
) {
  let cursor = next < now - lookahead ? now + 0.02 : next;
  const times = [];
  while (cursor < now + lookahead && times.length < maxNotes) {
    times.push(cursor);
    cursor += stepDuration;
  }
  return { times, next: cursor };
}
