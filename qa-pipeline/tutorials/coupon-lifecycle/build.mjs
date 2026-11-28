#!/usr/bin/env node
// Run from any directory. Secrets remain outside the repositories.
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, cpSync, rmSync, openSync, closeSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const envFile = args.find(a => a.startsWith('--env-file='))?.slice(11) ?? join(homedir(), '.config/urgentprinters-tutorials/.env.local');
const draft = args.includes('--draft');
const archiveOnly = args.includes('--archive-only');
const artifacts = 'qa-pipeline/artifacts';
const run = `${artifacts}/runs/coupon-lifecycle-run.json`;
const shots = `${artifacts}/shot-lists/coupon-lifecycle-shotlist.json`;
const narration = `${artifacts}/narration/coupon-lifecycle-narration.json`;
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

if (!archiveOnly && !args.includes('--reuse-capture')) {
  const previousRun = existsSync(resolve(root, run)) ? JSON.parse(readFileSync(resolve(root, run), 'utf8')) : null;
  let ownedApi;
  const status = async () => {
    try { const r = await fetch('http://localhost:8020/__tutorial/status', { signal: AbortSignal.timeout(1500) }); return r.ok ? await r.json() : null; }
    catch { return null; }
  };
  let current = await status();
  if (!current) {
    const backend = resolve(root, '../urgent-printers-backend');
    const logDir = join(homedir(), '.config/urgentprinters-tutorials');
    mkdirSync(logDir, { recursive: true });
    const fd = openSync(join(logDir, 'coupon-lifecycle-api.log'), 'a', 0o600);
    ownedApi = spawn(resolve(backend, '.venv/bin/python'), [resolve(root, 'qa-pipeline/tutorials/coupon-lifecycle/dev-api.py')], { cwd: backend, stdio: ['ignore', fd, fd] });
    closeSync(fd);
    process.on('exit', () => ownedApi?.kill('SIGTERM'));
    for (let attempt = 0; attempt < 25 && !current; attempt++) {
      await new Promise(done => setTimeout(done, 500)); current = await status();
    }
  }
  if (!current?.tutorial || current.outbound_providers !== 'fake' || current.task_broker !== 'memory://') throw new Error('A verified isolated development API is required on localhost:8020.');
  exec(resolve(root, '../urgent-printers-backend/.venv/bin/python'), ['qa-pipeline/tutorials/coupon-lifecycle/prepare-customer.py']);
  exec('npx', ['playwright', 'test', '--config=qa-pipeline/playwright/playwright.config.js', 'coupon-lifecycle.video.spec.js']);
  ownedApi?.kill('SIGTERM');
  // Carry forward only previously inspected messages on the same route and a passing
  // action. New errors and failed actions still require a fresh editorial review.
  const freshRun = JSON.parse(readFileSync(resolve(root, run), 'utf8'));
  const editorial = JSON.parse(readFileSync(resolve(root, shots), 'utf8'));
  const routeKind = route => route?.replace(/\/\d+(?=\/|$)/g, '/:id');
  editorial.reviewed_console_findings = (editorial.reviewed_console_findings ?? []).flatMap(review => {
    const before = previousRun?.steps.find(step => step.step_id === review.step_id);
    const after = freshRun.steps.find(step => step.step_id === review.step_id);
    if (after && !after.console_errors?.length) return [];
    if (before && after?.status === 'pass' && review.run_timestamp === previousRun.run_timestamp &&
        routeKind(before.route) === routeKind(after.route) && after.console_errors.every(message => review.messages.includes(message))) {
      return [{ ...review, run_timestamp: freshRun.run_timestamp }];
    }
    return [review];
  });
  writeFileSync(resolve(root, shots), JSON.stringify(editorial, null, 2) + '\n');
}
for (const [kind, file] of [['plan', `${artifacts}/plans/coupon-lifecycle-plan.json`], ['run', run], ['shotlist', shots]]) {
  exec('node', ['qa-pipeline/scripts/validate.mjs', kind, file, ...(kind === 'shotlist' ? [`--run=${run}`] : [])]);
}
if (!draft && !archiveOnly) {
  exec('node', ['qa-pipeline/scripts/synthesize-narration.mjs', `--narration=${narration}`, `--env-file=${envFile}`]);
  exec('node', ['qa-pipeline/scripts/validate.mjs', 'narration', narration, `--shotlist=${shots}`]);
  exec('node', ['qa-pipeline/tutorials/coupon-lifecycle/subtitles.mjs']);
}
const resolutions = args.find(a => a.startsWith('--resolutions=')) ?? '--resolutions=1080p30,4K30';
if (!archiveOnly) {
  const standardPair = resolutions.split('=')[1].split(',').sort().join(',') === '1080p30,4K30';
  if (standardPair && !draft && !args.includes('--contact-sheet')) {
    exec('node', ['qa-pipeline/tutorials/coupon-lifecycle/resume-render.mjs', '--render-only',
      `--concurrency=${args.find(a => a.startsWith('--concurrency='))?.split('=')[1] ?? 1}`, args.find(a => a.startsWith('--gl=')) ?? '--gl=swangle']);
  } else {
    exec('node', ['qa-pipeline/scripts/render-video.mjs', `--shotlist=${shots}`, `--run=${run}`, resolutions, '--sound-effects', '--derive-lower', '--project-name=Urgent Printers — Admin + Storefront', `--concurrency=${args.find(a => a.startsWith('--concurrency='))?.split('=')[1] ?? 1}`, args.find(a => a.startsWith('--gl=')) ?? '--gl=swangle', ...(draft ? ['--draft'] : [`--narration=${narration}`]), ...(args.includes('--contact-sheet') ? ['--contact-sheet'] : [])]);
  }
}
if (!draft && !archiveOnly && !args.includes('--contact-sheet')) exec('node', ['qa-pipeline/tutorials/coupon-lifecycle/normalize-audio.mjs', resolutions]);
if (!draft && !args.includes('--contact-sheet')) exec('node', ['qa-pipeline/tutorials/coupon-lifecycle/verify.mjs', resolutions, ...(archiveOnly ? ['--metadata-only'] : [])]);

// Complete portable production snapshot, including ignored plates, audio and exact sources.
if (!args.includes('--contact-sheet')) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = resolve(root, artifacts, 'video/archives/coupon-lifecycle', stamp);
  mkdirSync(destination, { recursive: true });
  for (const file of [run, 'qa-pipeline/artifacts/runs/coupon-lifecycle-evidence.json', shots, narration, `${artifacts}/plans/coupon-lifecycle-plan.json`, `${artifacts}/screenshots/coupon-lifecycle`, `${artifacts}/narration/coupon-lifecycle`, `${artifacts}/video/sfx`, `${artifacts}/video/renders/coupon-lifecycle`, 'qa-pipeline/tutorials/coupon-lifecycle', 'qa-pipeline/remotion', 'qa-pipeline/schemas', 'qa-pipeline/scripts/validate.mjs', 'qa-pipeline/scripts/render-video.mjs', 'qa-pipeline/scripts/synthesize-narration.mjs', 'qa-pipeline/playwright/capture.js', 'qa-pipeline/playwright/capture-reporter.js', 'qa-pipeline/playwright/playwright.config.js', 'qa-pipeline/playwright/specs/coupon-lifecycle.video.spec.js', 'package.json', 'package-lock.json', 'project.config.json', 'next.config.ts']) {
    if (existsSync(resolve(root, file))) cpSync(resolve(root, file), join(destination, file), { recursive: true });
  }
  writeFileSync(join(destination, 'manifest.json'), JSON.stringify({ created_at: new Date().toISOString(), draft, resolutions, render_gl: args.find(a => a.startsWith('--gl='))?.split('=')[1] ?? 'swangle', node_version: process.version, audio_normalized: !draft, run: JSON.parse(readFileSync(resolve(root, run), 'utf8')).run_timestamp, credentials_included: false }, null, 2));
  exec('tar', ['-czf', `${destination}.tar.gz`, '-C', dirname(destination), basename(destination)]);
  // Compressed snapshots keep archived source files out of application TS/test discovery.
  rmSync(destination, { recursive: true });
  console.log(`Full production archive: ${destination}.tar.gz`);
}
