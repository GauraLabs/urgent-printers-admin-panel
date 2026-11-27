import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../catalog-production/build.mjs', import.meta.url));
if (!process.argv.some(arg => ['--reuse-capture', '--archive-only'].includes(arg))) {
  const status = await fetch('http://127.0.0.1:8000/__tutorial/status', {signal: AbortSignal.timeout(5000)})
    .then(response => response.json()).catch(() => null);
  if (!status?.tutorial || status.environment !== 'development' || status.outbound_providers !== 'fake') {
    throw new Error('Start the isolated development read API on port 8000 before recording; storefront server rendering needs it. See README.md.');
  }
}
const result = spawnSync(process.execPath, [script, '--feature=order-lifecycle', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
