import { spawnSync } from 'node:child_process';
import { renameSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const labels = process.argv.find(a => a.startsWith('--resolutions='))?.split('=')[1].split(',') ?? ['1080p30', '4K30'];
for (const label of labels) {
  if (!/^(4K|\d+p)\d+$/i.test(label)) throw new Error(`Invalid resolution: ${label}`);
  const input = resolve(root, `qa-pipeline/artifacts/video/renders/coupon-lifecycle/${label}.mp4`);
  const output = input.replace(/\.mp4$/, '-audio-normalized.mp4');
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input,
    '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', output], { stdio: 'inherit' });
  if (result.status !== 0) { rmSync(output, { force: true }); throw new Error(`Audio normalization failed: ${label}`); }
  renameSync(output, input);
  console.log(`Normalized ${label} narration and Foley mix to -16 LUFS / -1.5 dBTP.`);
}
