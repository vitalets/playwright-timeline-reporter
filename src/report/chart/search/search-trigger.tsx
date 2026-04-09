/**
 * Button that opens the global search dialog.
 */
import { SearchIcon } from './search-icon.js';
import { useSearchContext } from './search-context.js';

export function SearchTrigger() {
  const { openDialog } = useSearchContext();

  return (
    <button
      type="button"
      className="search-trigger toolbox-button toolbox-control"
      onClick={openDialog}
      aria-label="Open search"
      title="Search timeline (Cmd+K / Ctrl+K)"
    >
      <span className="search-trigger-label">
        <SearchIcon width={15} height={15} />
        <span className="search-trigger-text">Search...</span>
      </span>
    </button>
  );
}
