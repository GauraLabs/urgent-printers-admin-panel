import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../../remotion/timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const narration = read('qa-pipeline/artifacts/narration/coupon-lifecycle-narration.json');
if (narration.lines.some(l => !l.duration_ms || !l.audio_path)) throw new Error('Synthesize narration before exporting subtitles.');
const timeline = buildTimeline(read('qa-pipeline/artifacts/shot-lists/coupon-lifecycle-shotlist.json'), read('qa-pipeline/artifacts/runs/coupon-lifecycle-run.json'), 30, { narration });
const segments = [
  { line: timeline.narration.intro, from: 0 },
  ...timeline.shots.map(s => ({ line: s.narration, from: s.from })),
  { line: timeline.narration.outro, from: timeline.outroFrom },
].filter(s => s.line);
const timestamp = ms => {
  const n = Math.round(ms);
  return `${String(Math.floor(n / 3600000)).padStart(2, '0')}:${String(Math.floor(n / 60000) % 60).padStart(2, '0')}:${String(Math.floor(n / 1000) % 60).padStart(2, '0')},${String(n % 1000).padStart(3, '0')}`;
};
const output = resolve(root, 'qa-pipeline/artifacts/video/renders/coupon-lifecycle');
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'coupon-lifecycle.hi-en.srt'), segments.map(({ line, from }, i) => {
  const start = (from + line.fromFrame) / 30 * 1000;
  return `${i + 1}\n${timestamp(start)} --> ${timestamp(start + line.duration_ms)}\n${line.text}\n`;
}).join('\n'));
console.log('Hindi-English subtitles exported.');
const chapters = [
  [0, 'Coupon lifecycle overview'],
  ...[
    ['cp-01', 'Create and configure the coupon'],
    ['lc-01', 'Activate the offer'],
    ['sf-01', 'Storefront: minimum order and discount cap'],
    ['sf-12', 'Checkout and order confirmation'],
    ['ad-01', 'Admin order and redemption analytics'],
    ['sf-20', 'Per-customer limit and deactivation'],
    ['ad-06', 'Cancellation, released quota and historical analytics'],
  ].map(([id, title]) => [timeline.shots.find(shot => shot.step_id === id).from / 30, title]),
];
writeFileSync(resolve(output, 'chapters.txt'), chapters.map(([seconds, title]) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds) % 60).padStart(2, '0')} ${title}`).join('\n') + '\n');
