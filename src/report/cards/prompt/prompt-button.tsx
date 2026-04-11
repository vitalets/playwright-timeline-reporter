/**
 * Renders the prompt button for the AI Insights card.
 */
import type { ChartData } from '../../data/index.js';
import { DownloadIcon } from '../../icons/download-icon.js';
import { buildPrompt } from './builder.js';

const PROMPT_DOWNLOAD_FILENAME = 'prompt-timeline-reporter.md';

export function PromptButton({
  chartData,
  promptTemplate,
}: {
  chartData: ChartData;
  promptTemplate: string;
}) {
  function handleDownload() {
    const text = buildPrompt(chartData, promptTemplate);
    downloadPrompt(text);
  }

  return (
    <span style={{ fontSize: '1.1rem' }}>
      <button type="button" onClick={handleDownload} className="prompt-button">
        <DownloadIcon width={14} height={14} />
        prompt
      </button>
    </span>
  );
}

function downloadPrompt(text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = PROMPT_DOWNLOAD_FILENAME;
  link.style.display = 'none';

  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
