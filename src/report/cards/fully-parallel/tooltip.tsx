/**
 * Tooltip content for the Fully Parallel card explaining the fullyParallel Playwright flag.
 */
import { TooltipBody, TooltipHeader } from '../tooltip.js';

export function FullyParallelTooltip() {
  return (
    <div>
      <TooltipHeader>Fully Parallel Flag</TooltipHeader>
      <TooltipBody>
        <p>
          By default, Playwright runs in non-fully parallel mode and assigns the{' '}
          <strong>entire test file</strong> to a worker, so tests in that file run in order.
        </p>
        <p>
          In fully parallel mode, Playwright splits test files into{' '}
          <strong>individual tests</strong> and distributes them across multiple workers. This is
          usually faster, but tests must be independent.
        </p>
      </TooltipBody>
    </div>
  );
}
