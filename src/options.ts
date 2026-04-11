/**
 * Timeline reporter options.
 */
import path from 'node:path';

export type TimelineReporterOptions = {
  /** Path to the report file (relative to config dir). */
  outputFile?: string;
  /** Path to a custom prompt template file. The file must include the `{data}` placeholder exactly once. */
  promptTemplateFile?: string;
  /** Enables reporter debug logs and extra debug data in the generated HTML report. */
  debug?: boolean;
};

const defaults = {
  outputFile: path.join('timeline-report', 'index.html'),
  debug: false,
} satisfies Partial<TimelineReporterOptions>;

export type TimelineReporterOptionsResolved = ReturnType<typeof resolveOptions>;

export function resolveOptions(options?: TimelineReporterOptions) {
  return { ...defaults, ...options };
}
