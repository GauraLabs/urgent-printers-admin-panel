import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../catalog-production/build.mjs', import.meta.url));
const result = spawnSync(process.execPath, [script, '--feature=product-lifecycle', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
