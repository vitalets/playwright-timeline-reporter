/**
 * Timeline reporter options.
 */
import path from 'node:path';

export type TimelineReporterOptions = {
  /**
   * Path to the report file (relative to config dir).
   */
  outputFile?: string;
  /**
   * Path to a custom prompt template file. The file must include the `{data}` placeholder exactly once.
   */
  promptTemplateFile?: string;
  /**
   * Enables reporter debug logs and extra debug data in the generated HTML report.
   */
  debug?: boolean;
};

const defaults = {
  outputFile: path.join('timeline-report', 'index.html'),
  debug: false,
} satisfies Partial<TimelineReporterOptions>;

export type TimelineReporterOptionsResolved = ReturnType<typeof resolveOptions>;

export function resolveOptions(options?: TimelineReporterOptions) {
  return {
    ...defaults,
    ...options,
    ...getOptionsFromEnv(),
  };
}

// Follows Playwright's conventions for reporter env vars:
// - env vars take precedence over config values:
//   https://github.com/microsoft/playwright/blob/v1.59.1/packages/playwright/src/reporters/html.ts#L111
// - empty string is treated as not set:
//   https://github.com/microsoft/playwright/blob/v1.59.1/packages/playwright/src/reporters/html.ts#L197
function getOptionsFromEnv(): Partial<TimelineReporterOptions> {
  const result: Partial<TimelineReporterOptions> = {};

  const envOutputFile = process.env.PLAYWRIGHT_TIMELINE_OUTPUT_FILE;
  if (envOutputFile) result.outputFile = envOutputFile;

  const envDebug = process.env.PLAYWRIGHT_TIMELINE_DEBUG;
  if (envDebug) result.debug = envDebug !== '0' && envDebug !== 'false';

  return result;
}
