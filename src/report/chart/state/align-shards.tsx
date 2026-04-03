/**
 * Stores the chart view mode that toggles shard-local left alignment in merged reports.
 */
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useReportData } from './report-data.js';

type AlignShardsContextValue = {
  shardsAligned: boolean;
  setShardsAligned: Dispatch<SetStateAction<boolean>>;
  applyShardOffset: (time: number, mergeReportId?: string) => number;
};

const AlignShardsContext = createContext<AlignShardsContextValue | null>(null);

export function AlignShardsProvider({ children }: { children?: ReactNode }) {
  const { runInfo } = useReportData();
  const [shardsAligned, setShardsAligned] = useState(false);
  const applyShardOffset = useCallback(
    (time: number, mergeReportId?: string) => {
      if (!shardsAligned || !mergeReportId) return time;

      const mergeReport = runInfo.mergeReports[mergeReportId];
      if (!mergeReport) return time;

      return time - (mergeReport.startTime - runInfo.startTime);
    },
    [shardsAligned, runInfo],
  );
  const value = useMemo(
    () => ({ shardsAligned, setShardsAligned, applyShardOffset }),
    [shardsAligned, applyShardOffset],
  );
  return <AlignShardsContext value={value}>{children}</AlignShardsContext>;
}

export function useAlignShards() {
  const value = useContext(AlignShardsContext);
  if (!value) {
    throw new Error('useAlignShards() must be used within <AlignShardsProvider>.');
  }
  return value;
}
