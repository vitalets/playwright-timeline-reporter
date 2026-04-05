/**
 * Card displaying whether Playwright's fullyParallel mode is enabled.
 * In merge report mode, checks all individual reports and shows "mixed" if values differ.
 */
import type { RunInfo } from '../../../run-info.js';
import { Card, type ValueType } from '../card.js';
import { FullyParallelTooltip } from './tooltip.js';

export function FullyParallelCard({ runInfo }: { runInfo: RunInfo }) {
  return (
    <Card
      label="Fully Parallel"
      value={getFullyParallelValue(runInfo)}
      valueType={getFullyParallelValueType(runInfo)}
      tooltip={<FullyParallelTooltip />}
    />
  );
}

function getFullyParallelValue(runInfo: RunInfo) {
  const mergeReportValues = Object.values(runInfo.mergeReports);
  if (mergeReportValues.length > 0) {
    const values = mergeReportValues.map((r) => r.fullyParallel);
    const allSame = values.every((v) => v === values[0]);
    if (!allSame) return 'mixed';
    return values[0] ? 'yes' : 'no';
  }
  return runInfo.fullyParallel ? 'yes' : 'no';
}

function getFullyParallelValueType(runInfo: RunInfo): ValueType {
  const mergeReportValues = Object.values(runInfo.mergeReports);
  if (mergeReportValues.length > 0) {
    const values = mergeReportValues.map((r) => r.fullyParallel);
    const allSame = values.every((v) => v === values[0]);
    if (!allSame) return 'normal';
    return values[0] ? 'good' : 'normal';
  }
  return runInfo.fullyParallel ? 'good' : 'normal';
}
