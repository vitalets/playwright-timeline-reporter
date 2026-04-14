/**
 * Programmatic entry point for worker-lane tests.
 * Usage: node test/worker-lanes/run.ts [glob]
 */
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const arg = process.argv[2] || '';
const globPatterns = [`test/worker-lanes/${arg}*/test.ts`];

const stream = run({ globPatterns, concurrency: 1 });
stream.on('test:fail', () => (process.exitCode = 1));
stream.compose(spec).pipe(process.stdout);
