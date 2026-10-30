/**
 * Append Markdown to the GitHub step summary within its size budget.
 * GITHUB_STEP_SUMMARY contains the path to a per-step file, not Markdown content.
 * GitHub reads that file after the step finishes, so publishing means appending to it
 * (equivalent to `echo "Markdown" >> "$GITHUB_STEP_SUMMARY"`). Check its existing size
 * to preserve earlier content and keep the combined summary within the budget.
 * Outside GitHub Actions, the variable is usually unset and this is a no-op.
 */
import fs from 'node:fs';

export const SUMMARY_BUDGET = 900 * 1024;
const logger = console;

export function appendGitHubSummary(markdown: string) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) appendSummary(file, markdown);
}

function appendSummary(file: string, markdown: string) {
  try {
    const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
    const separator = size ? '\n\n' : '';
    const available = SUMMARY_BUDGET - size - Buffer.byteLength(separator);
    const content = getSummaryContent(markdown, available);
    if (content === undefined) {
      logger.warn('[timeline-reporter/markdown]: GitHub summary is full; left unchanged.');
      return;
    }
    fs.appendFileSync(file, separator + content);
  } catch (error) {
    logger.warn(`[timeline-reporter/markdown]: Could not append GitHub summary: ${error.message}`);
  }
}

function getSummaryContent(markdown: string, available: number) {
  if (Buffer.byteLength(markdown, 'utf8') <= available) return markdown;
  const chartStart = markdown.indexOf('```mermaid\n');
  if (chartStart === -1) return;
  const fallback =
    markdown.slice(0, chartStart) + 'Diagram omitted: GitHub step summary size budget exceeded.\n';
  if (Buffer.byteLength(fallback, 'utf8') <= available) return fallback;
}
