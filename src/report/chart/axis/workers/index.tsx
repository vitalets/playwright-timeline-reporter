/**
 * Renders the y-axis worker lane labels on the left side of the chart,
 * and horizontal grid lines at the lane boundaries.
 */
import { useSelectedArea } from '../../state/selected-area.js';
import { AxisWorkerLabels } from './axis-labels.js';
import { AxisWorkerTicks } from './axis-ticks.js';

export function AxisWorkers() {
  const { workersRange, setSelectedArea, resetSelectedArea } = useSelectedArea();

  const onWorkerClick = (workerIndex: number) => {
    if (workersRange[0] === workerIndex && workersRange[1] === workerIndex) {
      resetSelectedArea();
    } else {
      setSelectedArea({ workersRange: [workerIndex, workerIndex] });
    }
  };

  return (
    <>
      <AxisWorkerTicks />
      <AxisWorkerLabels onWorkerClick={onWorkerClick} />
    </>
  );
}
