/** Manages table filters, URL state, sorting, and pagination for test-case triage. */
import { useEffect, useMemo, useState } from 'react';
import type { TestTimings } from '../../test-timings/types.js';
import {
  buildTestTableRows,
  filterAndSortTestTableRows,
  getStatusCounts,
  getTableColumns,
  type TableSort,
} from './data.js';

export const PAGE_SIZES = [25, 50, 100];
export const DURATION_FILTERS = [0, 10_000, 30_000, 60_000];

export function useTestTableState(timings: TestTimings[]) {
  const rows = useMemo(() => buildTestTableRows(timings), [timings]);
  const statusCounts = useMemo(() => getStatusCounts(rows), [rows]);
  const initialState = useMemo(() => getInitialState([...statusCounts.keys()]), [statusCounts]);
  const [query, setQueryInternal] = useState(initialState.query);
  const [sort, setSortInternal] = useState<TableSort | null>(initialState.sort);
  const [statuses, setStatusesInternal] = useState(initialState.statuses);
  const [minDuration, setMinDurationInternal] = useState(initialState.minDuration);
  const [page, setPage] = useState(initialState.page);
  const [pageSize, setPageSizeInternal] = useState(initialState.pageSize);
  const filteredRows = useMemo(
    () => filterAndSortTestTableRows(rows, { query, sort, statuses, minDuration }),
    [rows, query, sort, statuses, minDuration],
  );
  const columns = useMemo(() => getTableColumns(rows), [rows]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);

  usePersistedTableState({ query, sort, statuses, minDuration, page: safePage, pageSize });

  return {
    query,
    sort,
    statuses,
    minDuration,
    page: safePage,
    pageSize,
    rows,
    columns,
    filteredRows,
    pageCount,
    visibleRows: filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    statusCounts,
    setPage,
    setQuery: (value: string) => updateAndResetPage(setQueryInternal, setPage, value),
    setSort: (value: TableSort) => updateAndResetPage(setSortInternal, setPage, value),
    setMinDuration: (value: number) => updateAndResetPage(setMinDurationInternal, setPage, value),
    setPageSize: (value: number) => updateAndResetPage(setPageSizeInternal, setPage, value),
    toggleStatus: (status: string) => {
      setStatusesInternal((current) => toggleStatus(current, status, [...statusCounts.keys()]));
      setPage(1);
    },
    clearStatuses: () => updateAndResetPage(setStatusesInternal, setPage, [...statusCounts.keys()]),
    resetFilters: () => {
      setQueryInternal('');
      setSortInternal(null);
      setStatusesInternal([...statusCounts.keys()]);
      setMinDurationInternal(0);
      setPage(1);
    },
  };
}

// eslint-disable-next-line visual/complexity
function getInitialState(allStatuses: string[]) {
  const params = new URLSearchParams(window.location.search);
  const sortColumn = params.get('tableSort');
  const direction = params.get('tableDirection');
  return {
    query: params.get('tableQuery') ?? '',
    sort: isSort(sortColumn, direction)
      ? { column: sortColumn, direction: direction as TableSort['direction'] }
      : null,
    statuses: parseStatuses(params.get('tableStatuses'), allStatuses),
    minDuration: Number(params.get('tableMinDuration')) || 0,
    page: Math.max(1, Number(params.get('tablePage')) || 1),
    pageSize: PAGE_SIZES.includes(Number(params.get('tablePageSize')))
      ? Number(params.get('tablePageSize'))
      : PAGE_SIZES[0],
  };
}

function usePersistedTableState(state: ReturnType<typeof getInitialState>) {
  // eslint-disable-next-line visual/complexity
  useEffect(() => {
    const url = new URL(window.location.href);
    setOrDelete(url.searchParams, 'tableQuery', state.query);
    setOrDelete(url.searchParams, 'tableStatuses', state.statuses.join(','));
    setOrDelete(
      url.searchParams,
      'tableMinDuration',
      state.minDuration ? String(state.minDuration) : '',
    );
    setOrDelete(url.searchParams, 'tablePage', state.page === 1 ? '' : String(state.page));
    setOrDelete(
      url.searchParams,
      'tablePageSize',
      state.pageSize === PAGE_SIZES[0] ? '' : String(state.pageSize),
    );
    setOrDelete(url.searchParams, 'tableSort', state.sort?.column ?? '');
    setOrDelete(url.searchParams, 'tableDirection', state.sort?.direction ?? '');
    window.history.replaceState(null, '', url);
  }, [state]);
}

function isSort(column: string | null, direction: string | null): column is TableSort['column'] {
  return (
    ['name', 'status', 'duration'].includes(column ?? '') &&
    ['ascending', 'descending'].includes(direction ?? '')
  );
}

function parseStatuses(value: string | null, allStatuses: string[]) {
  const selected = value?.split(',').filter((status) => allStatuses.includes(status));
  return selected?.length ? selected : allStatuses;
}

function toggleStatus(current: string[], status: string, allStatuses: string[]) {
  const next = current.includes(status)
    ? current.filter((item) => item !== status)
    : [...current, status];
  return next.length ? next : allStatuses;
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function updateAndResetPage<T>(
  setValue: (value: T) => void,
  setPage: (page: number) => void,
  value: T,
) {
  setValue(value);
  setPage(1);
}
