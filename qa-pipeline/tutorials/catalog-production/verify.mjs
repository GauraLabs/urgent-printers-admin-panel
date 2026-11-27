import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../../remotion/timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const feature = process.argv.find(a => a.startsWith('--feature='))?.slice(10);
if (!['category-creation', 'product-lifecycle', 'order-lifecycle', 'content-banners', 'content-testimonials', 'content-announcements', 'content-faqs', 'content-navigation', 'content-theme', 'system-cod-payments', 'system-staff-notifications', 'system-order-controls', 'system-pricing-diagnostics', 'system-activity-log', 'system-staff', 'system-settings-overview', 'system-system-health', 'customer-management', 'customer-reviews'].includes(feature)) throw new Error('Pass --feature=category-creation or --feature=product-lifecycle');
const read = p => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const run = read(`qa-pipeline/artifacts/runs/${feature}-run.json`);
const narration = read(`qa-pipeline/artifacts/narration/${feature}-narration.json`);
const shotlist = read(`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`);
const labels = process.argv.find(a => a.startsWith('--resolutions='))?.split('=')[1].split(',') ?? ['1080p30', '4K30'];
const reportPath = resolve(root, `qa-pipeline/artifacts/video/renders/${feature}/quality-report.json`);
const previous = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : null;
const videos = [];
for (const label of labels) {
  const match = /^(4K|\d+p)(\d+)$/i.exec(label);
  if (!match) throw new Error(`Invalid resolution: ${label}`);
  const height = match[1].toLowerCase() === '4k' ? 2160 : Number(match[1].slice(0, -1));
  const fps = Number(match[2]);
  const path = `qa-pipeline/artifacts/video/renders/${feature}/${label}.mp4`;
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
  const loudness=spawnSync('ffmpeg',['-hide_banner','-i',resolve(root,path),'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8',maxBuffer:2*1024*1024});
  const loudnessMatch=loudness.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if(loudness.status!==0||!loudnessMatch)throw new Error(`Cannot measure audio in ${label}`);
  const measured=JSON.parse(loudnessMatch[0]);
  const audioLufs=Number(measured.input_i),audioPeak=Number(measured.input_tp);
  if(!Number.isFinite(audioLufs)||audioLufs < -18||audioLufs > -14||audioPeak > -0.5)throw new Error(`Silent, clipped or unbalanced audio in ${label}: ${audioLufs} LUFS / ${audioPeak} dBTP`);
  const sha256 = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
  let decodedAt = previous?.videos.find(v => v.sha256 === sha256)?.full_decode_verified_at ?? null;
  if (!process.argv.includes('--metadata-only')) {
    console.log(`Checking every video and audio frame in ${label}…`);
    const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', resolve(root, path), '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    if (decoded.status !== 0 || decoded.stderr.trim()) throw new Error(`Decode errors in ${label}: ${decoded.stderr}`);
    decodedAt = new Date().toISOString();
    console.log(`✓ ${label}: complete video/audio decode passed.`);
  }
  videos.push({ path, width: video.width, height, fps, duration_seconds: duration, video_codec: video.codec_name, audio_codec: audio.codec_name, integrated_loudness_lufs: audioLufs, true_peak_dbtp: audioPeak, bytes: Number(data.format.size), sha256, full_decode_verified_at: decodedAt });
}
if (run.steps.length !== shotlist.shots.length || run.steps.some(s => s.status !== 'pass')) throw new Error('Browser capture did not pass all planned steps.');
const report = { verified_at: new Date().toISOString(), browser_steps_passed: run.steps.length, console_errors: run.steps.flatMap(s => s.console_errors ?? []), narration_voice: narration.tts, narration_lines: narration.lines.length, videos };
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
const statusPath=resolve(root,`qa-pipeline/artifacts/video/renders/${feature}/production-status.json`);
if(existsSync(statusPath)&&videos.every(video=>video.full_decode_verified_at)){
  const status=JSON.parse(readFileSync(statusPath,'utf8'));
  writeFileSync(statusPath,JSON.stringify({...status,narration_complete:true,cached_narration_clips:narration.lines.length,pending_narration_clips:0,pending_narration_characters:0,final_video_complete:true,blocker:null,stage:'complete',verified_at:report.verified_at,exports:videos.map(video=>({path:video.path,duration_seconds:video.duration_seconds,sha256:video.sha256}))},null,2)+'\n');
}
console.log(JSON.stringify(report, null, 2));
