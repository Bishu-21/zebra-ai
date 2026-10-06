import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const files = (await readdir(new URL('../tests/', import.meta.url), { recursive: true }))
    .filter((file) => file.endsWith('.test.ts'))
    .sort();

const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--test', ...files.map((file) => `tests/${file.replaceAll('\\', '/')}`)],
    {
        cwd: new URL('../', import.meta.url),
        env: { ...process.env, NODE_ENV: 'test' },
        stdio: 'inherit',
    },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
