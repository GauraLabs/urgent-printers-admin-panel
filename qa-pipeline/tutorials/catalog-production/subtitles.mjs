import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../../remotion/timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const feature = process.argv.find(a => a.startsWith('--feature='))?.slice(10);
if (!['category-creation', 'product-lifecycle', 'order-lifecycle', 'content-banners', 'content-testimonials', 'content-announcements', 'content-faqs', 'content-navigation', 'content-theme', 'system-cod-payments', 'system-staff-notifications', 'system-order-controls', 'system-pricing-diagnostics', 'system-activity-log', 'system-staff', 'system-settings-overview', 'system-system-health', 'customer-management', 'customer-reviews'].includes(feature)) throw new Error('Pass --feature=category-creation or --feature=product-lifecycle');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const narration = read(`qa-pipeline/artifacts/narration/${feature}-narration.json`);
if (narration.lines.some(l => !l.duration_ms || !l.audio_path)) throw new Error('Synthesize narration before exporting subtitles.');
const timeline = buildTimeline(read(`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`), read(`qa-pipeline/artifacts/runs/${feature}-run.json`), 30, { narration });
const segments = [
  { line: timeline.narration.intro, from: 0 },
  ...timeline.shots.map(s => ({ line: s.narration, from: s.from })),
  { line: timeline.narration.outro, from: timeline.outroFrom },
].filter(s => s.line);
const timestamp = ms => {
  const n = Math.round(ms);
  return `${String(Math.floor(n / 3600000)).padStart(2, '0')}:${String(Math.floor(n / 60000) % 60).padStart(2, '0')}:${String(Math.floor(n / 1000) % 60).padStart(2, '0')},${String(n % 1000).padStart(3, '0')}`;
};
const output = resolve(root, `qa-pipeline/artifacts/video/renders/${feature}`);
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, `${feature}.hi-en.srt`), segments.map(({ line, from }, i) => {
  const start = (from + line.fromFrame) / 30 * 1000;
  return `${i + 1}\n${timestamp(start)} --> ${timestamp(start + line.duration_ms)}\n${line.text}\n`;
}).join('\n'));
console.log('Hindi-English subtitles exported.');
const definition = read(`qa-pipeline/tutorials/${feature}/content.json`);
const chapters = [[0, definition.title], ...definition.chapters.map(([id, title]) => [timeline.shots.find(s => s.step_id === id).from / 30, title])];
writeFileSync(resolve(output, 'chapters.txt'), chapters.map(([seconds, title]) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds) % 60).padStart(2, '0')} ${title}`).join('\n') + '\n');
