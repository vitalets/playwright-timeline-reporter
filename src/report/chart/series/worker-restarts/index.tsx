/**
 * Renders worker restart markers: vertical dotted line + right-pointing triangle.
 */
import { useMemo } from 'react';
import { useReportData } from '../../state/report-data.js';
import { useScale } from '../../scales/index.js';
import { isVisible } from '../../scales/time.js';
import { useAlignShards } from '../../state/align-shards.js';
import { RestartMarker, WorkerRestartData } from './marker.js';
import { MouseEventProps } from '../types.js';

const HEIGHT_RATIO = 0.6;
const TRIANGLE_SIZE = 10;

export function SeriesWorkerRestarts(props: MouseEventProps) {
  const { restarts, workers } = useReportData();
  const { timeScale, workersScale, getRect } = useScale();
  const { applyShardOffset } = useAlignShards();

  const markerData = useMemo(() => {
    const result: WorkerRestartData[] = [];
    workersScale.domain().forEach((laneIndex) => {
      const mergeReportId = workers[laneIndex]?.mergeReportId;
      restarts
        .filter((r) => {
          const time = applyShardOffset(r.time, mergeReportId);
          return r.laneIndex === laneIndex && isVisible(timeScale, time, 0);
        })
        .forEach((restart) => {
          const time = applyShardOffset(restart.time, mergeReportId);
          const rect = getRect(time, 0, laneIndex, HEIGHT_RATIO);
          result.push({ restart, rect });
        });
    });
    return result;
  }, [restarts, workers, timeScale, workersScale, getRect, applyShardOffset]);

  return (
    <>
      {markerData.map((data) => {
        // Stable key to avoid DOM re-creation when the visible range changes
        const key = `${data.restart.laneIndex}-${data.restart.time}`;
        return <RestartMarker key={key} data={data} triangleSize={TRIANGLE_SIZE} {...props} />;
      })}
    </>
  );
}
