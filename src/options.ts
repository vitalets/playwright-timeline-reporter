/**
 * Timeline reporter options.
 */
import path from 'node:path';
import { readBooleanEnvVar } from './utils/env.js';

export type TimelineReporterOptions = {
  /**
   * Path to the report file (relative to config dir).
   */
  outputFile?: string;
  /**
   * Write a Markdown file: true for the default path, or a config-relative output file path.
   */
  markdownFile?: boolean | string;
  /** Append the Markdown timeline to the GitHub Actions workflow summary. */
  markdownCI?: boolean;
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
  markdownFile: false,
  markdownCI: false,
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
// - empty string for outputFile and markdownFile is treated as not set:
//   https://github.com/microsoft/playwright/blob/v1.59.1/packages/playwright/src/reporters/html.ts#L197
function getOptionsFromEnv(): Partial<TimelineReporterOptions> {
  const result: Partial<TimelineReporterOptions> = {};

  const envOutputFile = process.env.PLAYWRIGHT_TIMELINE_OUTPUT_FILE;
  if (envOutputFile) result.outputFile = envOutputFile;

  const envMarkdown = process.env.PLAYWRIGHT_TIMELINE_MARKDOWN_FILE;
  if (envMarkdown) result.markdownFile = parseBooleanEnvVar(envMarkdown);

  const envMarkdownCI = readBooleanEnvVar('PLAYWRIGHT_TIMELINE_MARKDOWN_CI');
  if (envMarkdownCI !== undefined) result.markdownCI = envMarkdownCI;

  const envDebug = readBooleanEnvVar('PLAYWRIGHT_TIMELINE_DEBUG');
  if (envDebug !== undefined) result.debug = envDebug;

  return result;
}

function parseBooleanEnvVar(value: string): boolean | string {
  if (value === 'false' || value === '0') return false;
  if (value === 'true' || value === '1') return true;
  return value;
}
