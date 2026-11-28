#!/usr/bin/env node
// Run from any directory. Secrets remain outside the repositories.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, cpSync, rmSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const envFile = args.find(a => a.startsWith('--env-file='))?.slice(11) ?? join(homedir(), '.config/urgentprinters-tutorials/.env.local');
const draft = args.includes('--draft');
const archiveOnly = args.includes('--archive-only');
const artifacts = 'qa-pipeline/artifacts';
const run = `${artifacts}/runs/coupon-creation-run.json`;
const shots = `${artifacts}/shot-lists/coupon-creation-shotlist.json`;
const narration = `${artifacts}/narration/coupon-creation-narration.json`;
function exec(command, values) {
  const result = spawnSync(command, values, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Original deterministic Foley: no third-party sound downloads or licensing dependencies.
const sfxDir = resolve(root, artifacts, 'video/sfx');
mkdirSync(sfxDir, { recursive: true });
for (const [name, duration, frequency] of [['click', 0.085, 1600], ['key', 0.04, 950]]) {
  const rate = 44100, length = Math.round(rate * duration);
  const wav = Buffer.alloc(44 + length * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(length * 2, 40);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const envelope = Math.exp(-t * (name === 'click' ? 100 : 155)) * Math.min(1, t * 2500);
    const sample = (Math.sin(2 * Math.PI * frequency * t) + 0.35 * Math.sin(2 * Math.PI * frequency * 2.31 * t)) * envelope * 0.55;
    wav.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  writeFileSync(join(sfxDir, `${name}.wav`), wav);
}

if (!archiveOnly && !args.includes('--reuse-capture')) exec('npx', ['playwright', 'test', '--config=qa-pipeline/playwright/playwright.config.js', 'coupon-creation.video.spec.js']);
for (const [kind, file] of [['plan', `${artifacts}/plans/coupon-creation-plan.json`], ['run', run], ['shotlist', shots]]) {
  exec('node', ['qa-pipeline/scripts/validate.mjs', kind, file, ...(kind === 'shotlist' ? [`--run=${run}`] : [])]);
}
if (!draft && !archiveOnly) {
  exec('node', ['qa-pipeline/scripts/synthesize-narration.mjs', `--narration=${narration}`, `--env-file=${envFile}`]);
  exec('node', ['qa-pipeline/scripts/validate.mjs', 'narration', narration, `--shotlist=${shots}`]);
  exec('node', ['qa-pipeline/tutorials/coupon-creation/subtitles.mjs']);
}
const resolutions = args.find(a => a.startsWith('--resolutions=')) ?? '--resolutions=1080p30,4K30';
if (!archiveOnly) exec('node', ['qa-pipeline/scripts/render-video.mjs', `--shotlist=${shots}`, `--run=${run}`, resolutions, '--sound-effects', '--derive-lower', `--concurrency=${args.find(a => a.startsWith('--concurrency='))?.split('=')[1] ?? 1}`, args.find(a => a.startsWith('--gl=')) ?? '--gl=swangle', ...(draft ? ['--draft'] : [`--narration=${narration}`]), ...(args.includes('--contact-sheet') ? ['--contact-sheet'] : [])]);
if (!draft && !archiveOnly && !args.includes('--contact-sheet')) exec('node', ['qa-pipeline/tutorials/coupon-creation/normalize-audio.mjs', resolutions]);
if (!draft && !args.includes('--contact-sheet')) exec('node', ['qa-pipeline/tutorials/coupon-creation/verify.mjs', resolutions]);

// Complete portable production snapshot, including ignored plates, audio and exact sources.
if (!args.includes('--contact-sheet')) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = resolve(root, artifacts, 'video/archives/coupon-creation', stamp);
  mkdirSync(destination, { recursive: true });
  for (const file of [run, shots, narration, `${artifacts}/plans/coupon-creation-plan.json`, `${artifacts}/screenshots/coupon-creation`, `${artifacts}/narration/coupon-creation`, `${artifacts}/video/sfx`, `${artifacts}/video/renders/coupon-creation`, 'qa-pipeline/tutorials/coupon-creation', 'qa-pipeline/remotion', 'qa-pipeline/schemas', 'qa-pipeline/scripts/validate.mjs', 'qa-pipeline/scripts/render-video.mjs', 'qa-pipeline/scripts/synthesize-narration.mjs', 'qa-pipeline/playwright/capture.js', 'qa-pipeline/playwright/capture-reporter.js', 'qa-pipeline/playwright/playwright.config.js', 'qa-pipeline/playwright/specs/coupon-creation.video.spec.js', 'package.json', 'package-lock.json', 'project.config.json']) {
    if (existsSync(resolve(root, file))) cpSync(resolve(root, file), join(destination, file), { recursive: true });
  }
  writeFileSync(join(destination, 'manifest.json'), JSON.stringify({ created_at: new Date().toISOString(), draft, resolutions, render_gl: args.find(a => a.startsWith('--gl='))?.split('=')[1] ?? 'swangle', node_version: process.version, audio_normalized: !draft, run: JSON.parse(readFileSync(resolve(root, run), 'utf8')).run_timestamp, credentials_included: false }, null, 2));
  exec('tar', ['-czf', `${destination}.tar.gz`, '-C', dirname(destination), basename(destination)]);
  // Compressed snapshots keep archived source files out of application TS/test discovery.
  rmSync(destination, { recursive: true });
  console.log(`Full production archive: ${destination}.tar.gz`);
}
