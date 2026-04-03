/**
 * Stores the active chart focus filter applied by legend clicks and search selections.
 */
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useTimer } from '../../use-timer.js';
import { useSelectedProject } from './selected-project.js';

const SEARCH_PULSE_DURATION_MS = 1500;

export type FocusFilter = {
  field?: 'spanGroupId' | 'seriesId' | 'filePath' | 'testId' | 'spanId';
  value?: string;
  project?: string;
  pulsing?: boolean;
};

type FocusFilterState = {
  field: FocusFilter['field'];
  value: string;
  pulsing?: boolean;
};

type FocusFilterContextValue = {
  focusFilter?: FocusFilter;
  setFocusFilter: (
    field: FocusFilter['field'],
    value: string,
    options?: { pulsing?: boolean },
  ) => void;
  resetFocusFilter: () => void;
};

const FocusFilterContext = createContext<FocusFilterContextValue | null>(null);

export function FocusFilterProvider({ children }: { children?: ReactNode }) {
  const { selectedProject } = useSelectedProject();
  const [focusFilterInternal, setFocusFilterInternal] = useState<FocusFilterState>();
  const { startTimer: startPulsing, stopTimer: stopPulsing } = useTimer(
    SEARCH_PULSE_DURATION_MS,
    () => {
      setFocusFilterInternal((current) => (current ? { ...current, pulsing: false } : current));
    },
  );

  const projectName = selectedProject?.name;

  const focusFilter = useMemo(
    () => ({
      field: focusFilterInternal?.field,
      value: focusFilterInternal?.value,
      project: projectName,
      pulsing: focusFilterInternal?.pulsing,
    }),
    [focusFilterInternal, projectName],
  );

  const setFocusFilter = useCallback(
    (
    field: FocusFilter['field'],
    value: string,
    options?: { pulsing?: boolean },
  ) => {
    stopPulsing();
    const pulsing = options?.pulsing ?? false;
    setFocusFilterInternal({ field, value, pulsing });
    if (pulsing) startPulsing();
    },
    [startPulsing, stopPulsing],
  );

  const resetFocusFilter = useCallback(() => {
    stopPulsing();
    setFocusFilterInternal(undefined);
  }, [stopPulsing]);

  const value = useMemo(
    () => ({
      focusFilter,
      setFocusFilter,
      resetFocusFilter,
    }),
    [focusFilter, resetFocusFilter, setFocusFilter],
  );

  return <FocusFilterContext value={value}>{children}</FocusFilterContext>;
}

export function useFocusFilter() {
  const value = useContext(FocusFilterContext);
  if (!value) {
    throw new Error('useFocusFilter() must be used within <FocusFilterProvider>.');
  }
  return value;
}
