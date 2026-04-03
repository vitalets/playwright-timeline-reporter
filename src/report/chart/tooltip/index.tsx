import { ChartSpan } from '../../data/tests.js';
import { WorkerRestart } from '../../data/worker-restarts.js';
import { BaseTooltip } from '../lib/tooltip.js';
import { TestSpanTooltip } from './test-span/index.js';
import { WorkerRestartTooltip } from './worker-restart/index.js';

export type TooltipData = ChartSpan | WorkerRestart;

export type TooltipProps = {
  left: number;
  top: number;
  visible: boolean;
  data: TooltipData;
};

export function Tooltip({ left, top, data, visible }: TooltipProps) {
  return (
    <BaseTooltip
      left={left}
      top={top}
      visible={visible}
      offset={30}
      style={{
        background: 'var(--tooltip-bg)',
        color: 'var(--tooltip-text)',
        border: '1px solid var(--tooltip-border)',
        borderRadius: 10,
        padding: '8px 10px',
        fontSize: 14,
        lineHeight: 1.4,
        boxShadow: 'var(--tooltip-shadow)',
      }}
    >
      {'span' in data ? <TestSpanTooltip data={data} /> : <WorkerRestartTooltip data={data} />}
    </BaseTooltip>
  );
}
