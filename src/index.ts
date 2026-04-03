/**
 * A wrapper to provide reporter type-safe options.
 * Do not import any modules here, as this file is used in the Playwright config.
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
import type { TimelineReporterOptions } from './options.js';

export function timelineReporter(options?: TimelineReporterOptions) {
  return ['playwright-timeline-reporter/reporter', options] as const;
}
