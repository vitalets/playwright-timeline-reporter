import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { ProjectData } from '../../data/projects.js';
import { useReportData } from './report-data.js';

type SelectedProjectContextValue = {
  selectedProject: ProjectData | null;
  setSelectedProject: (projectName: string | null) => void;
};

const SelectedProjectContext = createContext<SelectedProjectContextValue | null>(null);

export function SelectedProjectProvider({ children }: { children?: ReactNode }) {
  const { projects } = useReportData();
  const [selectedProjectName, setSelectedProject] = useState<string | null>(null);

  const selectedProject = useMemo(
    () =>
      selectedProjectName ? (projects.find((p) => p.name === selectedProjectName) ?? null) : null,
    [projects, selectedProjectName],
  );

  const value = useMemo(() => ({ selectedProject, setSelectedProject }), [selectedProject]);

  return <SelectedProjectContext value={value}>{children}</SelectedProjectContext>;
}

export function useSelectedProject() {
  const value = useContext(SelectedProjectContext);
  if (!value) {
    throw new Error('useSelectedProject() must be used within <SelectedProjectProvider>.');
  }
  return value;
}
