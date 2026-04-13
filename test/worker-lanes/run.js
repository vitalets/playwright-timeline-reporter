/**
 * Programmatic entry point for worker-lane tests.
 * Usage: node test/worker-lanes/run.js [glob]
 */
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const args = process.argv.slice(2);
const globPatterns = args.length
  ? args.map((arg) => `test/worker-lanes/${arg}*/test.js`)
  : ['test/worker-lanes/*/test.js'];

const stream = run({ globPatterns, concurrency: 1 });
stream.on('test:fail', () => (process.exitCode = 1));
stream.compose(spec).pipe(process.stdout);
