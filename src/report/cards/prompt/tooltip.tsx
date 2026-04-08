/**
 * Tooltip content for the Prompt card.
 */
import { TooltipBody, TooltipHeader } from '../tooltip.js';

export function PromptTooltip() {
  return (
    <div>
      <TooltipHeader>AI Insights</TooltipHeader>
      <TooltipBody>Ready-to-use prompt to get AI insights for this test run.</TooltipBody>
    </div>
  );
}
