#!/usr/bin/env node
// Persistent frame checkpoints let an interrupted production resume without repeating work.
import { bundle } from '@remotion/bundler';
import { renderFrames, renderStill, selectComposition } from '@remotion/renderer';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync, openSync, readSync, closeSync, statSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../remotion/timeline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const feature = process.argv.find(a => a.startsWith('--feature='))?.slice(10);
if (!['category-creation', 'product-lifecycle', 'order-lifecycle', 'content-banners', 'content-testimonials', 'content-announcements', 'content-faqs', 'content-navigation', 'content-theme', 'system-cod-payments', 'system-staff-notifications', 'system-order-controls', 'system-pricing-diagnostics', 'system-activity-log', 'system-staff', 'system-settings-overview', 'system-system-health', 'customer-management', 'customer-reviews'].includes(feature)) throw new Error('Pass --feature=category-creation or --feature=product-lifecycle');
const args = process.argv.slice(2);
const flag = name => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const run = read(`qa-pipeline/artifacts/runs/${feature}-run.json`);
const shotlist = read(`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`);
const narration = read(`qa-pipeline/artifacts/narration/${feature}-narration.json`);
const config = read('project.config.json');
const fps = 30, width = 3840, height = 2160;
const timeline = buildTimeline(shotlist, run, fps, { narration, leadInMs: config.tts.lead_in_ms, tailMs: config.tts.tail_ms });
const duration = timeline.totalFrames / fps;
const digest = createHash('sha256').update(JSON.stringify({ run, shotlist, narration, config, fps, width, height }));
for (const name of readdirSync(resolve(root, 'qa-pipeline/remotion')).sort()) {
  if (/\.(js|jsx)$/.test(name)) digest.update(readFileSync(resolve(root, 'qa-pipeline/remotion', name)));
}
for (const step of run.steps) for (const path of [step.screenshot_path, step.before_screenshot_path]) if (path) digest.update(readFileSync(resolve(root, path)));
for (const line of narration.lines) digest.update(readFileSync(resolve(root, line.audio_path)));
const fingerprint = digest.digest('hex');
const cache = join(homedir(), `.cache/urgentprinters-tutorials/${feature}`, fingerprint.slice(0, 16));
mkdirSync(dirname(cache), { recursive: true });
if (flag('adopt-frames') && !existsSync(cache)) renameSync(resolve(flag('adopt-frames')), cache);
mkdirSync(cache, { recursive: true });
const manifest = join(cache, 'checkpoint.json');
if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).fingerprint !== fingerprint) throw new Error('Checkpoint inputs do not match.');
writeFileSync(manifest, JSON.stringify({ fingerprint, width, height, fps, total_frames: timeline.totalFrames, adopted_from: flag('adopt-frames') ?? null }, null, 2));
const padding = String(timeline.totalFrames - 1).length;
const framePath = frame => join(cache, `element-${String(frame).padStart(padding, '0')}.jpeg`);
function validJpeg(path) {
  if (!existsSync(path) || statSync(path).size < 100) return false;
  const fd = openSync(path, 'r'); const start = Buffer.alloc(2), end = Buffer.alloc(2);
  try { readSync(fd, start, 0, 2, 0); readSync(fd, end, 0, 2, statSync(path).size - 2); }
  finally { closeSync(fd); }
  return start.readUInt16BE() === 0xffd8 && end.readUInt16BE() === 0xffd9;
}
const missing = Array.from({ length: timeline.totalFrames }, (_, frame) => frame).filter(frame => !validJpeg(framePath(frame)));
console.log(`Checkpoint: ${cache}`);
console.log(`Reusing ${timeline.totalFrames - missing.length}/${timeline.totalFrames} frames; ${missing.length} remain.`);
const publicDir=mkdtempSync(join(tmpdir(),`${feature}-public-`));
let serveUrl;
try {
 for(const path of [`screenshots/${feature}`,`narration/${feature}`,'video/sfx'])cpSync(resolve(root,'qa-pipeline/artifacts',path),join(publicDir,path),{recursive:true});
 serveUrl=await bundle({entryPoint:resolve(root,'qa-pipeline/remotion/index.jsx'),publicDir});
} finally {rmSync(publicDir,{recursive:true,force:true});}
process.on('exit',()=>{if(serveUrl.startsWith(join(tmpdir(),'remotion-webpack-bundle-')))rmSync(serveUrl,{recursive:true,force:true});});
const props = { run, shotlist, narration, brand: config.brand, fieldStyle: config.video_defaults.field_style,
  projectName: 'Urgent Printers — Admin + Storefront', logoDataUri: null, screenshotBase: 'qa-pipeline/artifacts/',
  narrationTiming: { leadInMs: config.tts.lead_in_ms, tailMs: config.tts.tail_ms }, soundEffects: true, draft: false, fps, width, height };
const composition = await selectComposition({ serveUrl, id: 'FeatureDemo', inputProps: props });
if (flag('check-frame')) {
  await renderStill({ composition, serveUrl, inputProps: props, frame: Number(flag('check-frame')), output: `/tmp/${feature}-check.jpeg`, imageFormat: 'jpeg', jpegQuality: 80, chromiumOptions: { gl: flag('gl') ?? 'vulkan' } });
  console.log(`Checkpoint comparison frame: /tmp/${feature}-check.jpeg`);
  process.exit(0);
}
if (missing.length) {
  let logged = -1;
  await renderFrames({ composition, serveUrl, inputProps: props, outputDir: cache, frames: missing, imageFormat: 'jpeg', jpegQuality: 80,
    concurrency: Number(flag('concurrency') ?? 2), timeoutInMilliseconds: 120000, muted: true, chromiumOptions: { gl: flag('gl') ?? 'vulkan' },
    onStart: () => {}, onFrameUpdate: count => {
      const percent = Math.floor((timeline.totalFrames - missing.length + count) / timeline.totalFrames * 100 / 5) * 5;
      if (percent > logged) { console.log(`Frames ${percent}%`); logged = percent; }
    } });
}
for (let frame = 0; frame < timeline.totalFrames; frame++) if (!validJpeg(framePath(frame))) throw new Error(`Incomplete frame ${frame}`);

function exec(command, values, options = {}) {
  const result = spawnSync(command, values, { cwd: root, stdio: 'inherit', ...options });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
  return result;
}
exec('node',['qa-pipeline/tutorials/catalog-production/review.mjs',`--feature=${feature}`,`--cache=${cache}`]);
// Same frame-based audio schedule and gains as FeatureDemo.jsx, mixed without a browser.
const rate = 48000, samplesPerFrame = rate / fps;
const mix = new Float32Array(Math.ceil(duration * rate));
const decoded = new Map();
function addAudio(path, fromFrame, gain = 1, maxFrames = Infinity) {
  if (!decoded.has(path)) {
    const result = exec('ffmpeg', ['-v', 'error', '-i', resolve(root, path), '-f', 'f32le', '-ac', '1', '-ar', String(rate), '-'], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 32 * 1024 * 1024 });
    decoded.set(path, result.stdout);
  }
  const buffer = decoded.get(path), offset = Math.round(fromFrame * samplesPerFrame);
  const count = Math.min(buffer.length / 4, mix.length - offset, Math.round(maxFrames * samplesPerFrame));
  for (let sample = 0; sample < count; sample++) mix[offset + sample] += buffer.readFloatLE(sample * 4) * gain;
}
for (const [line, from] of [[timeline.narration.intro, 0], ...timeline.shots.map(s => [s.narration, s.from]), [timeline.narration.outro, timeline.outroFrom]]) {
  if (line) addAudio(line.audio_path, from + line.fromFrame);
}
for (const shot of timeline.shots.filter(s => s.hasTarget)) {
  addAudio('qa-pipeline/artifacts/video/sfx/click.wav', shot.from + shot.travelFrames, 0.22, Math.max(1, Math.round(fps * 0.09)));
  const keys = Math.min(shot.typedText?.length ?? 0, 24);
  for (let key = 0; key < keys; key++) addAudio('qa-pipeline/artifacts/video/sfx/key.wav', shot.from + shot.typingFrom + Math.floor(key / keys * (shot.typingTo - shot.typingFrom)), 0.09, Math.max(1, Math.round(fps * 0.045)));
}
const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36 + mix.byteLength, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(3, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(32, 34); header.write('data', 36); header.writeUInt32LE(mix.byteLength, 40);
const audio = join(cache, 'full-mix.wav'); writeFileSync(audio, Buffer.concat([header, Buffer.from(mix.buffer)]));
const out = resolve(root, `qa-pipeline/artifacts/video/renders/${feature}`); mkdirSync(out, { recursive: true });
const probe=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=black:s=1920x1080:r=30','-frames:v','1','-c:v','h264_nvenc','-f','null','-'],{stdio:'ignore'});
const hardware=flag('encoder')!=='software'&&probe.status===0;
const codecArgs=hardware?['-c:v','h264_nvenc','-preset','p6','-tune','hq','-rc','vbr','-cq','16','-b:v','0','-profile:v','high']:['-c:v','libx264','-crf','18','-preset','medium','-threads','4'];
writeFileSync(join(out,'render-receipt.json'),JSON.stringify({fingerprint,cache,width,height,fps,total_frames:timeline.totalFrames,encoder:hardware?'h264_nvenc CQ16 p6':'libx264 CRF18 medium',sound_effects:true},null,2)+'\n');
console.log(`Encoding complete 4K master and synchronized audio (${hardware?'NVENC':'software'})…`);
exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-start_number', '0', '-i', join(cache, `element-%0${padding}d.jpeg`), '-i', audio,
  ...codecArgs, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-t', String(duration), '-movflags', '+faststart', join(out, '4K30.mp4')]);
console.log('4K master complete; deriving 1080p…');
exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', join(out, '4K30.mp4'), '-vf', 'scale=1920:1080:flags=lanczos', ...codecArgs, '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', join(out, '1080p30.mp4')]);
if (!args.includes('--render-only')) {
  exec('node', ['qa-pipeline/tutorials/catalog-production/normalize-audio.mjs', `--feature=${feature}`]);
  exec('node', ['qa-pipeline/tutorials/catalog-production/verify.mjs', `--feature=${feature}`]);
  exec('node', ['qa-pipeline/tutorials/catalog-production/build.mjs', `--feature=${feature}`, '--archive-only', '--gl=' + (flag('gl') ?? 'vulkan')]);
}
console.log('Complete. Persistent frame checkpoint retained for safe resumption.');
