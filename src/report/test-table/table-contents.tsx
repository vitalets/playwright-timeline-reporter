/** Renders table headers, execution rows, and the filtered-results empty state. */
import { formatTime } from '../utils.js';
import { useState } from 'react';
import { useFocusFilter } from '../chart/state/focus-filter.js';
import { getNextSort, type SortColumn, type TableSort, type TestTableRow } from './data.js';

export function TestTableContents({
  columns,
  query,
  rows,
  sort,
  onSort,
  onShowError,
  onResetFilters,
}: {
  columns: { error: boolean; project: boolean; retry: boolean; mergeReport: boolean };
  query: string;
  rows: TestTableRow[];
  sort: TableSort | null;
  onSort: (sort: TableSort) => void;
  onShowError: (error: string) => void;
  onResetFilters: () => void;
}) {
  return (
    <div className="test-table-scroll">
      <table>
        <TableHeaders columns={columns} sort={sort} onSort={onSort} />
        <tbody>
          {rows.length ? (
            <TestRows columns={columns} rows={rows} onShowError={onShowError} />
          ) : (
            <EmptyRow columns={columns} query={query} onResetFilters={onResetFilters} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableHeaders({
  columns,
  sort,
  onSort,
}: {
  columns: { error: boolean; project: boolean; retry: boolean; mergeReport: boolean };
  sort: TableSort | null;
  onSort: (sort: TableSort) => void;
}) {
  return (
    <thead>
      <tr>
        <SortableHeader column="name" sort={sort} onSort={onSort}>
          Test name
        </SortableHeader>
        <SortableHeader column="status" sort={sort} onSort={onSort}>
          Status
        </SortableHeader>
        <SortableHeader column="duration" sort={sort} onSort={onSort}>
          Duration
        </SortableHeader>
        <th scope="col">Path</th>
        {columns.error && <th scope="col">Error</th>}
        {columns.project && <th scope="col">Project</th>}
        {columns.retry && <th scope="col">Retry</th>}
        {columns.mergeReport && <th scope="col">Shard / report</th>}
      </tr>
    </thead>
  );
}

function TestRows({
  columns,
  rows,
  onShowError,
}: {
  columns: { error: boolean; project: boolean; retry: boolean; mergeReport: boolean };
  rows: TestTableRow[];
  onShowError: (error: string) => void;
}) {
  return rows.map((row) => (
    <TestRow key={row.index} columns={columns} row={row} onShowError={onShowError} />
  ));
}

function TestRow({
  columns,
  row,
  onShowError,
}: {
  columns: { error: boolean; project: boolean; retry: boolean; mergeReport: boolean };
  row: TestTableRow;
  onShowError: (error: string) => void;
}) {
  const { setFocusFilter } = useFocusFilter();

  return (
    <tr className={getRowClassName(row)}>
      <th scope="row">
        <button
          type="button"
          className="test-table-test-name"
          onClick={() => setFocusFilter('testId', row.testId, { pulsing: true })}
        >
          {row.title}
        </button>
      </th>
      <td>
        <span className={`test-status test-status-${row.status}`}>{row.status}</span>
      </td>
      <td>{formatTime(row.duration)}</td>
      <PathCell path={row.path} />
      {columns.error && <ErrorCell error={row.error} onShowError={onShowError} />}
      <ProjectCell enabled={columns.project} projectName={row.projectName} />
      <RetryCell enabled={columns.retry} retry={row.retry} />
      <MergeReportCell enabled={columns.mergeReport} mergeReportId={row.mergeReportId} />
    </tr>
  );
}

function PathCell({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const copyPath = async () => {
    await navigator.clipboard?.writeText(path);
    setCopied(true);
  };
  return (
    <td className="test-table-path">
      <button type="button" onClick={copyPath} title="Copy file location">
        {copied ? 'Copied' : path || '—'}
      </button>
    </td>
  );
}

function ErrorCell({
  error,
  onShowError,
}: {
  error?: string;
  onShowError: (error: string) => void;
}) {
  return error ? (
    <td className="test-table-error">
      <button type="button" onClick={() => onShowError(error)} title="Show full error">
        {error}
      </button>
    </td>
  ) : (
    <td>—</td>
  );
}

function ProjectCell({ enabled, projectName }: { enabled: boolean; projectName: string }) {
  return enabled ? <td>{projectName}</td> : null;
}

function RetryCell({ enabled, retry }: { enabled: boolean; retry: number }) {
  return enabled ? <td>{retry ? `Retry ${retry}` : 'Initial'}</td> : null;
}

function getRowClassName(row: TestTableRow) {
  return row.attempts > 1 && row.attempt === 1 ? 'test-table-retry-group-start' : undefined;
}

function MergeReportCell({ enabled, mergeReportId }: { enabled: boolean; mergeReportId?: string }) {
  return enabled ? <td>{mergeReportId ?? '—'}</td> : null;
}

function EmptyRow({
  columns,
  query,
  onResetFilters,
}: {
  columns: { error: boolean; project: boolean; retry: boolean; mergeReport: boolean };
  query: string;
  onResetFilters: () => void;
}) {
  const columnCount =
    4 +
    Number(columns.error) +
    Number(columns.project) +
    Number(columns.retry) +
    Number(columns.mergeReport);
  return (
    <tr>
      <td className="test-table-empty" colSpan={columnCount}>
        <div className="test-table-empty-content">
          <strong>No matching test cases</strong>
          <span>
            {query
              ? `No titles contain “${query}”. Try adjusting the search or filters.`
              : 'Your active filters exclude every test execution.'}
          </span>
          <button type="button" onClick={onResetFilters}>
            Clear filters
          </button>
        </div>
      </td>
    </tr>
  );
}

function SortableHeader({
  column,
  sort,
  onSort,
  children,
}: {
  column: SortColumn;
  sort: TableSort | null;
  onSort: (sort: TableSort) => void;
  children: string;
}) {
  const direction = sort?.column === column ? sort.direction : undefined;
  const indicator = direction === 'ascending' ? ' ↑' : direction === 'descending' ? ' ↓' : '';
  return (
    <th scope="col" aria-sort={direction}>
      <button
        type="button"
        className="test-table-sort"
        onClick={() => onSort(getNextSort(sort, column))}
      >
        {children}
        <span aria-hidden="true">{indicator}</span>
      </button>
    </th>
  );
}
