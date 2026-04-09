/**
 * A lightweight wrapper to provide reporter type-safe options in Playwright config.
 *
 * Usage:
 * import { timelineReporter } from 'playwright-timeline-reporter';
 *
 * export default defineConfig({
 *   reporter: [
 *     timelineReporter(),
 *   ],
 *   ...
 * });
 */
import { fileURLToPath } from 'node:url';
import type { TimelineReporterOptions } from './options.js';

const reporterPath = fileURLToPath(new URL('./reporter.js', import.meta.url));

export function timelineReporter(options?: TimelineReporterOptions) {
  return [reporterPath, options] as const;
}
