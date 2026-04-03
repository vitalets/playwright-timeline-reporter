/**
 * Tooltip content for the Prompt card.
 */
import { TooltipBody, TooltipHeader } from '../tooltip.js';

export function PromptTooltip() {
  return (
    <div>
      <TooltipHeader>Performance Insights Prompt</TooltipHeader>
      <TooltipBody>
        Ready-to-use prompt to get performance insights for this test run. Large prompts
        download as a Markdown file instead of being copied.
      </TooltipBody>
    </div>
  );
}
