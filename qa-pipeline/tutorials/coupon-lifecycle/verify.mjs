import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../../remotion/timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = p => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const run = read('qa-pipeline/artifacts/runs/coupon-lifecycle-run.json');
const narration = read('qa-pipeline/artifacts/narration/coupon-lifecycle-narration.json');
const shotlist = read('qa-pipeline/artifacts/shot-lists/coupon-lifecycle-shotlist.json');
const labels = process.argv.find(a => a.startsWith('--resolutions='))?.split('=')[1].split(',') ?? ['1080p30', '4K30'];
const reportPath = resolve(root, 'qa-pipeline/artifacts/video/renders/coupon-lifecycle/quality-report.json');
const previous = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : null;
const videos = [];
for (const label of labels) {
  const match = /^(4K|\d+p)(\d+)$/i.exec(label);
  if (!match) throw new Error(`Invalid resolution: ${label}`);
  const height = match[1].toLowerCase() === '4k' ? 2160 : Number(match[1].slice(0, -1));
  const fps = Number(match[2]);
  const path = `qa-pipeline/artifacts/video/renders/coupon-lifecycle/${label}.mp4`;
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
  const sha256 = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
  let decodedAt = previous?.videos.find(v => v.sha256 === sha256)?.full_decode_verified_at ?? null;
  if (!process.argv.includes('--metadata-only')) {
    console.log(`Checking every video and audio frame in ${label}…`);
    const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', resolve(root, path), '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    if (decoded.status !== 0 || decoded.stderr.trim()) throw new Error(`Decode errors in ${label}: ${decoded.stderr}`);
    decodedAt = new Date().toISOString();
    console.log(`✓ ${label}: complete video/audio decode passed.`);
  }
  videos.push({ path, width: video.width, height, fps, duration_seconds: duration, video_codec: video.codec_name, audio_codec: audio.codec_name, bytes: Number(data.format.size), sha256, full_decode_verified_at: decodedAt });
}
if (run.steps.length !== 53 || run.steps.some(s => s.status !== 'pass')) throw new Error('Browser capture did not pass all 53 steps.');
const report = { verified_at: new Date().toISOString(), browser_steps_passed: run.steps.length, console_errors: run.steps.flatMap(s => s.console_errors ?? []), narration_voice: narration.tts, narration_lines: narration.lines.length, videos };
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
