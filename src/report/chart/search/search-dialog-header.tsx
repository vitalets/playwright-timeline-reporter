/**
 * Dialog header with the search title and a dedicated close button.
 */
import { useSearchContext } from './search-context.js';
import { SearchCloseButton } from './search-close-button.js';

export function SearchDialogHeader() {
  const { closeDialog } = useSearchContext();

  return (
    <div className="search-dialog-header">
      <div className="search-dialog-title">Search</div>
      <SearchCloseButton onClose={closeDialog} />
    </div>
  );
}
