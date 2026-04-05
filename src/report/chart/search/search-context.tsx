/**
 * React context and provider for the global search dialog — holds all state,
 * derived values, refs, and actions so child components need no prop drilling.
 */
import {
  createContext,
  useCallback,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useReportData } from '../state/report-data.js';
import { useFocusFilter } from '../state/focus-filter.js';
import type { SearchResult, SearchResultGroup } from './search-data.js';
import { buildSearchResults, searchResults } from './search-data.js';

const DEBOUNCE_DELAY = 100;
const CLOSE_ANIMATION_MS = 120;
const MAX_RECENT_SEARCHES = 5;

export const GROUP_ORDER: SearchResultGroup[] = ['Files', 'Tests', 'Hooks / Fixtures', 'Errors'];

interface SearchContextValue {
  isOpen: boolean;
  isClosing: boolean;
  query: string;
  debouncedQuery: string;
  selectedValue: string;
  groupedResults: Map<SearchResultGroup, SearchResult[]>;
  orderedResults: SearchResult[];
  inputRef: RefObject<HTMLInputElement | null>;
  itemRefs: RefObject<Record<string, HTMLDivElement | null>>;
  setQuery: (query: string) => void;
  setSelectedValue: (value: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
  onSelectResult: (result: SearchResult) => void;
  moveUp: () => void;
  moveDown: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const { setFocusFilter } = useFocusFilter();
  const dialogState = useSearchDialogState(setFocusFilter);
  const resultsState = useSearchResultsState(dialogState.query, dialogState.recentResults);
  const { inputRef, itemRefs, isOpen, openDialog, selectedValue, setSelectedValue } = dialogState;
  const { orderedResults } = resultsState;

  useSyncSelectedValue(orderedResults, selectedValue, setSelectedValue);
  useScrollSelectedResult(itemRefs, selectedValue);
  useSearchShortcut(openDialog);
  useFocusSearchInput(inputRef, isOpen);

  const moveUp = () => moveSelection(-1, orderedResults, selectedValue, setSelectedValue);
  const moveDown = () => moveSelection(1, orderedResults, selectedValue, setSelectedValue);

  return (
    <SearchContext.Provider
      value={{
        ...dialogState,
        ...resultsState,
        selectedValue,
        orderedResults,
        inputRef,
        itemRefs,
        setSelectedValue,
        moveUp,
        moveDown,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within SearchProvider');
  return ctx;
}

function useSearchDialogState(setFocusFilter: ReturnType<typeof useFocusFilter>['setFocusFilter']) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimerRef = useRef<number | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [recentResults, setRecentResults] = useState<SearchResult[]>([]);
  const [selectedValue, setSelectedValue] = useState('');

  const clearCloseTimer = useCallback(() => {
    const timerId = closeTimerRef.current;
    if (timerId !== undefined) window.clearTimeout(timerId);
  }, []);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  const openDialog = () => {
    clearCloseTimer();
    setIsClosing(false);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  };

  const onSelectResult = (result: SearchResult) => {
    setFocusFilter(result.focusField, result.focusValue, { pulsing: true });
    setRecentResults((current) => buildRecentResults(current, result));
    closeDialog();
  };

  return {
    isOpen,
    isClosing,
    query,
    selectedValue,
    inputRef,
    itemRefs,
    recentResults,
    setQuery,
    setSelectedValue,
    openDialog,
    closeDialog,
    onSelectResult,
  };
}

function useSearchResultsState(query: string, recentResults: SearchResult[]) {
  const reportData = useReportData();
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_DELAY);
  const allResults = useMemo(() => buildSearchResults(reportData), [reportData]);
  const matchedResults = useMemo(
    () => searchResults(allResults, debouncedQuery),
    [allResults, debouncedQuery],
  );
  const displayedResults = debouncedQuery.trim() ? matchedResults : recentResults;
  const groupedResults = useMemo(() => groupResults(displayedResults), [displayedResults]);
  const orderedResults = useMemo(() => buildOrderedResults(groupedResults), [groupedResults]);

  return {
    debouncedQuery,
    groupedResults,
    orderedResults,
  };
}

function useSyncSelectedValue(
  orderedResults: SearchResult[],
  selectedValue: string,
  setSelectedValue: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    if (!orderedResults.length) {
      setSelectedValue('');
      return;
    }
    if (!orderedResults.some((result) => result.id === selectedValue)) {
      setSelectedValue(orderedResults[0].id);
    }
  }, [orderedResults, selectedValue, setSelectedValue]);
}

function useScrollSelectedResult(
  itemRefs: RefObject<Record<string, HTMLDivElement | null>>,
  selectedValue: string,
) {
  useEffect(() => {
    if (!selectedValue) return;
    itemRefs.current[selectedValue]?.scrollIntoView({ block: 'nearest' });
  }, [itemRefs, selectedValue]);
}

function useSearchShortcut(openDialog: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openDialog();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openDialog]);
}

function useFocusSearchInput(inputRef: RefObject<HTMLInputElement | null>, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [inputRef, isOpen]);
}

function groupResults(results: SearchResult[]) {
  const grouped = new Map<SearchResultGroup, SearchResult[]>();
  results.forEach((result) => {
    const groupItems = grouped.get(result.group) || [];
    groupItems.push(result);
    grouped.set(result.group, groupItems);
  });
  return grouped;
}

function buildOrderedResults(groupedResults: Map<SearchResultGroup, SearchResult[]>) {
  return GROUP_ORDER.flatMap((group) => groupedResults.get(group) || []);
}

function buildRecentResults(current: SearchResult[], result: SearchResult) {
  return [result, ...current.filter((item) => item.id !== result.id)].slice(0, MAX_RECENT_SEARCHES);
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function moveSelection(
  direction: 1 | -1,
  orderedResults: SearchResult[],
  selectedValue: string,
  setSelectedValue: (value: string) => void,
) {
  if (!orderedResults.length) return;
  const currentIndex = orderedResults.findIndex((result) => result.id === selectedValue);
  const startIndex = currentIndex === -1 ? (direction === 1 ? -1 : 0) : currentIndex;
  const nextIndex = Math.min(orderedResults.length - 1, Math.max(0, startIndex + direction));
  setSelectedValue(orderedResults[nextIndex].id);
}
