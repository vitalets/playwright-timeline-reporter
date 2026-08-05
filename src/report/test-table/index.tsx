/** Renders a searchable, sortable list of every recorded Playwright test attempt. */
import type { TestTimings } from '../../test-timings/types.js';
import { useState } from 'react';
import { ErrorDialog } from './error-dialog.js';
import { TestTableExportButtons } from './export-buttons.js';
import { TestTableContents } from './table-contents.js';
import { TestTablePagination } from './pagination.js';
import { TestTableToolbar } from './toolbar.js';
import { PAGE_SIZES, useTestTableState } from './use-table-state.js';

export function TestTable({ timings }: { timings: TestTimings[] }) {
  const state = useTestTableState(timings);
  const [error, setError] = useState<string>();

  return (
    <section className="test-table-section" aria-labelledby="test-table-heading">
      <TestTableHeader state={state} />
      <TestTableToolbar
        statuses={state.statusCounts}
        selectedStatuses={state.statuses}
        minDuration={state.minDuration}
        onToggleStatus={state.toggleStatus}
        onClearStatuses={state.clearStatuses}
        onMinDurationChange={state.setMinDuration}
        onSort={state.setSort}
      />
      <TestTableContents
        columns={state.columns}
        query={state.query}
        rows={state.visibleRows}
        sort={state.sort}
        onSort={state.setSort}
        onShowError={setError}
        onResetFilters={state.resetFilters}
      />
      {!!state.filteredRows.length && (
        <div className="test-table-footer">
          <span aria-hidden="true" />
          <TestTablePagination
            page={state.page}
            pageCount={state.pageCount}
            pageSize={state.pageSize}
            pageSizes={PAGE_SIZES}
            totalRows={state.filteredRows.length}
            onPageChange={state.setPage}
            onPageSizeChange={state.setPageSize}
          />
          <TestTableExportButtons rows={state.filteredRows} />
        </div>
      )}
      <ErrorDialog error={error} onClose={() => setError(undefined)} />
    </section>
  );
}

function TestTableHeader({ state }: { state: ReturnType<typeof useTestTableState> }) {
  return (
    <div className="test-table-heading">
      <div>
        <h2 id="test-table-heading">Test cases</h2>
        <p>{getExecutionCountLabel(state)}</p>
      </div>
      <label className="test-table-search-label">
        <span>Search test cases</span>
        <input
          type="search"
          value={state.query}
          onChange={(event) => state.setQuery(event.target.value)}
          placeholder="Filter by full test name"
        />
      </label>
    </div>
  );
}

function getExecutionCountLabel(state: ReturnType<typeof useTestTableState>) {
  const { filteredRows, page, pageSize, rows } = state;
  const total = filteredRows.length;
  const allRows = rows.length;
  if (!total) return `0 of ${allRows} executions`;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}–${end} of ${total} executions${total === allRows ? '' : ` (${allRows} total)`}`;
}
