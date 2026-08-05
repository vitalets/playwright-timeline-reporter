/** Renders triage counters and filters for the test-case table. */
import { DURATION_FILTERS } from './use-table-state.js';
import type { TableSort } from './data.js';

export function TestTableToolbar({
  statuses,
  selectedStatuses,
  minDuration,
  onToggleStatus,
  onClearStatuses,
  onMinDurationChange,
  onSort,
}: {
  statuses: Map<string, unknown[]>;
  selectedStatuses: string[];
  minDuration: number;
  onToggleStatus: (status: string) => void;
  onClearStatuses: () => void;
  onMinDurationChange: (duration: number) => void;
  onSort: (sort: TableSort) => void;
}) {
  return (
    <div className="test-table-toolbar">
      <div className="test-table-status-filters" aria-label="Filter by status">
        <span className="test-table-filter-label">Status</span>
        <button
          type="button"
          className={`test-table-filter ${selectedStatuses.length === statuses.size ? 'is-active' : ''}`}
          onClick={onClearStatuses}
        >
          All
        </button>
        {[...statuses].map(([status, rows]) => (
          <button
            key={status}
            type="button"
            className={`test-table-filter ${selectedStatuses.includes(status) ? 'is-active' : ''}`}
            aria-pressed={selectedStatuses.includes(status)}
            onClick={() => onToggleStatus(status)}
          >
            {status} <span>{rows.length}</span>
          </button>
        ))}
      </div>
      <TableActions
        minDuration={minDuration}
        onMinDurationChange={onMinDurationChange}
        onSort={onSort}
      />
    </div>
  );
}

function TableActions({
  minDuration,
  onMinDurationChange,
  onSort,
}: {
  minDuration: number;
  onMinDurationChange: (duration: number) => void;
  onSort: (sort: TableSort) => void;
}) {
  return (
    <div className="test-table-actions">
      <button
        type="button"
        className="test-table-filter"
        onClick={() => onSort({ column: 'duration', direction: 'descending' })}
      >
        Slowest tests
      </button>
      <label>
        Minimum duration
        <select
          value={minDuration}
          onChange={(event) => onMinDurationChange(Number(event.target.value))}
        >
          {DURATION_FILTERS.map((duration) => (
            <option key={duration} value={duration}>
              {formatDurationFilter(duration)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function formatDurationFilter(duration: number) {
  return duration ? `${duration / 1000}s` : 'Any duration';
}
