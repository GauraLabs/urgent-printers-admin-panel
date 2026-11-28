import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../../remotion/timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = p => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const run = read('qa-pipeline/artifacts/runs/coupon-creation-run.json');
const narration = read('qa-pipeline/artifacts/narration/coupon-creation-narration.json');
const shotlist = read('qa-pipeline/artifacts/shot-lists/coupon-creation-shotlist.json');
const labels = process.argv.find(a => a.startsWith('--resolutions='))?.split('=')[1].split(',') ?? ['1080p30', '4K30'];
const videos = [];
for (const label of labels) {
  const match = /^(4K|\d+p)(\d+)$/i.exec(label);
  if (!match) throw new Error(`Invalid resolution: ${label}`);
  const height = match[1].toLowerCase() === '4k' ? 2160 : Number(match[1].slice(0, -1));
  const fps = Number(match[2]);
  const path = `qa-pipeline/artifacts/video/renders/coupon-creation/${label}.mp4`;
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', resolve(root, path)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Cannot inspect ${path}: ${result.stderr}`);
  const data = JSON.parse(result.stdout);
  const video = data.streams.find(s => s.codec_type === 'video');
  const audio = data.streams.find(s => s.codec_type === 'audio');
  const duration = Number(data.format.duration);
  const timeline = buildTimeline(shotlist, run, fps, { narration });
  const [numerator, denominator] = video.avg_frame_rate.split('/').map(Number);
  if (video.width !== Math.round(height * 16 / 9) || video.height !== height || numerator / denominator !== fps || video.codec_name !== 'h264') throw new Error(`Unexpected video format: ${label}`);
  if (!audio || audio.codec_name !== 'aac' || Math.abs(duration - timeline.totalFrames / fps) > 0.25) throw new Error(`Missing audio or unexpected duration: ${label}`);
  videos.push({ path, width: video.width, height, fps, duration_seconds: duration, video_codec: video.codec_name, audio_codec: audio.codec_name, bytes: Number(data.format.size) });
}
if (run.steps.length !== 18 || run.steps.some(s => s.status !== 'pass')) throw new Error('Browser capture did not pass all 18 steps.');
const report = { verified_at: new Date().toISOString(), browser_steps_passed: run.steps.length, console_errors: run.steps.flatMap(s => s.console_errors ?? []), narration_voice: narration.tts, narration_lines: narration.lines.length, videos };
writeFileSync(resolve(root, 'qa-pipeline/artifacts/video/renders/coupon-creation/quality-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
