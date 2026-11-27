import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../../remotion/timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const narration = read('qa-pipeline/artifacts/narration/coupon-creation-narration.json');
if (narration.lines.some(l => !l.duration_ms || !l.audio_path)) throw new Error('Synthesize narration before exporting subtitles.');
const timeline = buildTimeline(read('qa-pipeline/artifacts/shot-lists/coupon-creation-shotlist.json'), read('qa-pipeline/artifacts/runs/coupon-creation-run.json'), 30, { narration });
const segments = [
  { line: timeline.narration.intro, from: 0 },
  ...timeline.shots.map(s => ({ line: s.narration, from: s.from })),
  { line: timeline.narration.outro, from: timeline.outroFrom },
].filter(s => s.line);
const timestamp = ms => {
  const n = Math.round(ms);
  return `${String(Math.floor(n / 3600000)).padStart(2, '0')}:${String(Math.floor(n / 60000) % 60).padStart(2, '0')}:${String(Math.floor(n / 1000) % 60).padStart(2, '0')},${String(n % 1000).padStart(3, '0')}`;
};
const output = resolve(root, 'qa-pipeline/artifacts/video/renders/coupon-creation');
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'coupon-creation.hi-en.srt'), segments.map(({ line, from }, i) => {
  const start = (from + line.fromFrame) / 30 * 1000;
  return `${i + 1}\n${timestamp(start)} --> ${timestamp(start + line.duration_ms)}\n${line.text}\n`;
}).join('\n'));
console.log('Hindi-English subtitles exported.');
