/**
 * Tooltip content for the Score card explaining the worker utilization score.
 */
import { TooltipBody, TooltipHeader } from '../tooltip.js';

export function ScoreTooltip() {
  return (
    <div>
      <TooltipHeader>Worker Utilization Score</TooltipHeader>
      <TooltipBody>Calculated as:</TooltipBody>
      <div className="tooltip-formula">
        &Sigma;(worker busy time) / &Sigma;(worker available time) &times; 100%
      </div>
      <TooltipBody>
        100% means every worker was busy for all of its available time. Lower values indicate less
        efficient worker utilization.
      </TooltipBody>
    </div>
  );
}
