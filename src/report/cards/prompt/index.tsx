/**
 * Renders the prompt card and builds the copyable prompt text for the current run.
 */
import type { ChartData } from '../../data/index.js';
import { Card } from '../card.js';
import { buildPrompt } from './builder.js';
import { PromptButton } from './button.js';
import { PromptTooltip } from './tooltip.js';

export function PromptCard({
  chartData,
  promptTemplate,
}: {
  chartData: ChartData;
  promptTemplate: string;
}) {
  const prompt = buildPrompt(chartData, promptTemplate);

  return <Card label="Prompt" tooltip={<PromptTooltip />} value={<PromptButton text={prompt} />} />;
}
