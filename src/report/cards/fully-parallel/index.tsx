/**
 * Card displaying whether Playwright's fullyParallel mode is enabled.
 */
import type { RunInfo } from '../../../run-info.js';
import { Card } from '../card.js';
import { FullyParallelTooltip } from './tooltip.js';

export function FullyParallelCard({ runInfo }: { runInfo: RunInfo }) {
  return (
    <Card
      label="Fully Parallel"
      value={runInfo.fullyParallel ? 'yes' : 'no'}
      valueType={runInfo.fullyParallel ? 'good' : 'normal'}
      tooltip={<FullyParallelTooltip />}
    />
  );
}
