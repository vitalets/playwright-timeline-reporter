/**
 * Renders the prompt card for downloading the AI Insights prompt for the current run.
 */
import type { ChartData } from '../../data/index.js';
import { Card } from '../card.js';
import { PromptButton } from './prompt-button.js';
import { PromptTooltip } from './tooltip.js';

export function PromptCard({
  chartData,
  promptTemplate,
}: {
  chartData: ChartData;
  promptTemplate: string;
}) {
  return (
    <Card
      label="AI Insights"
      tooltip={<PromptTooltip />}
      value={<PromptButton chartData={chartData} promptTemplate={promptTemplate} />}
    />
  );
}
