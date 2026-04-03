/**
 * Stores and updates the currently visible chart viewport for zoom and project changes.
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { RunInfo } from '../../../run-info.js';
import { MinMax } from '../lib/types.js';
import { useAlignShards } from './align-shards.js';
import { useReportData } from './report-data.js';
import { useSelectedProject } from './selected-project.js';

const PROJECT_TIME_PADDING = 0.05; // 5% padding each side of the project
const CHART_TIME_PADDING = 0.01; // +1% padding to the right side of the chart

type SetSelectedArea = (area: { timeRange?: MinMax; workersRange?: MinMax }) => void;
type SelectedAreaContextValue = {
  timeRange: MinMax;
  workersRange: MinMax;
  isZoomed: boolean;
  setSelectedArea: SetSelectedArea;
  resetSelectedArea: () => void;
};

const SelectedAreaContext = createContext<SelectedAreaContextValue | null>(null);

// eslint-disable-next-line max-statements
export function SelectedAreaProvider({ children }: { children?: ReactNode }) {
  const { workers, runInfo } = useReportData();
  const { shardsAligned } = useAlignShards();

  const chartEndTime = getChartEndTime(getChartDuration(runInfo, shardsAligned));
  const testRunWorkersRange: MinMax = useMemo(() => [0, workers.length - 1], [workers.length]);
  const testRunTimeRange: MinMax = useMemo(() => [0, chartEndTime], [chartEndTime]);
  const projectTimeRange = useProjectTimeRange(chartEndTime) ?? testRunTimeRange;
  const projectWorkersRange = testRunWorkersRange;

  const [zoomedTimeRange, setZoomedTimeRange] = useState<MinMax | null>(null);
  const [zoomedWorkersRange, setZoomedWorkersRange] = useState<MinMax | null>(null);

  const finalTimeRange = zoomedTimeRange ?? projectTimeRange;
  const finalWorkersRange = zoomedWorkersRange ?? projectWorkersRange;

  const isZoomed = Boolean(zoomedTimeRange || zoomedWorkersRange);

  const setSelectedArea = useCallback<SetSelectedArea>(({ timeRange, workersRange }) => {
    if (timeRange) setZoomedTimeRange(timeRange);
    if (workersRange) setZoomedWorkersRange(workersRange);
  }, []);

  const resetSelectedArea = useCallback(() => {
    setZoomedTimeRange(null);
    setZoomedWorkersRange(null);
  }, []);

  useOnEscapeHandler(resetSelectedArea);

  const value = useMemo(
    () => ({
      timeRange: finalTimeRange,
      workersRange: finalWorkersRange,
      isZoomed,
      setSelectedArea,
      resetSelectedArea,
    }),
    [finalTimeRange, finalWorkersRange, isZoomed, setSelectedArea, resetSelectedArea],
  );

  return <SelectedAreaContext value={value}>{children}</SelectedAreaContext>;
}

export function useSelectedArea() {
  const value = useContext(SelectedAreaContext);
  if (!value) {
    throw new Error('useSelectedArea() must be used within <SelectedAreaProvider>.');
  }
  return value;
}

function useOnEscapeHandler(handler: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) handler();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handler]);
}

function getChartEndTime(duration: number) {
  return duration * (1 + CHART_TIME_PADDING);
}

function getChartDuration(runInfo: RunInfo, shardsAligned: boolean) {
  if (!shardsAligned) return runInfo.duration;

  const shardDurations = Object.values(runInfo.mergeReports).map(
    (mergeReport) => mergeReport.duration,
  );
  return shardDurations.length ? Math.max(...shardDurations) : runInfo.duration;
}

function useProjectTimeRange(chartEndTime: number): MinMax | null {
  const { workers } = useReportData();
  const { selectedProject } = useSelectedProject();
  const { applyShardOffset } = useAlignShards();

  return useMemo(() => {
    const projectName = selectedProject?.name;
    if (!projectName) return null;

    const projectRanges = workers.flatMap((worker) =>
      worker.tests
        .filter((chartTest) => chartTest.test.projectName === projectName)
        .map((chartTest) => {
          const startTime = applyShardOffset(chartTest.relStartTime, worker.mergeReportId);
          return [startTime, startTime + chartTest.test.totalDuration] as const;
        }),
    );

    if (!projectRanges.length) return null;

    const startTime = Math.min(...projectRanges.map(([start]) => start));
    const endTime = Math.max(...projectRanges.map(([, end]) => end));
    const padding = (endTime - startTime) * PROJECT_TIME_PADDING;

    return clampTimeRange([startTime - padding, endTime + padding], chartEndTime);
  }, [workers, selectedProject, applyShardOffset, chartEndTime]);
}

function clampTimeRange([start, end]: MinMax, chartEndTime: number): MinMax {
  return [Math.max(0, start), Math.min(chartEndTime, end)];
}
