import { createContext, ReactNode, useContext } from 'react';
import { ChartData } from '../../data/index.js';

const ReportDataContext = createContext<ChartData | null>(null);

export function ReportDataProvider({ data, children }: { data: ChartData; children?: ReactNode }) {
  return <ReportDataContext value={data}>{children}</ReportDataContext>;
}

export function useReportData() {
  const data = useContext(ReportDataContext);
  if (!data) throw new Error('useReportData() must be used within <ReportDataProvider>.');
  return data;
}
