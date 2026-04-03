/**
 * Search input field with an inline clear action inside the search dialog.
 */
import { Command } from 'cmdk';
import type { KeyboardEvent } from 'react';
import { ClearCircleIcon } from '../../icons/clear-circle-icon.js';
import { useSearchContext } from './search-context.js';

export function SearchInput() {
  const { query, setQuery, inputRef, ...searchState } = useSearchContext();
  const onKeyDown = createInputKeyDownHandler(searchState);
  const clearQuery = () => resetQuery(setQuery, inputRef);

  return (
    <div className="search-dialog-input-wrap">
      <Command.Input
        ref={inputRef}
        value={query}
        onValueChange={setQuery}
        className="search-dialog-input"
        placeholder="Search tests, tags, files, hooks, fixtures, and errors..."
        onKeyDown={onKeyDown}
      />
      <div className="search-dialog-actions">
        <ClearQueryButton query={query} onClick={clearQuery} />
      </div>
    </div>
  );
}

function ClearQueryButton({ query, onClick }: { query: string; onClick: () => void }) {
  if (!query) return null;

  return (
    <button
      type="button"
      className="search-dialog-action-button search-dialog-clear"
      onClick={onClick}
      aria-label="Clear search input"
    >
      <ClearCircleIcon aria-hidden="true" className="search-dialog-clear-icon" />
    </button>
  );
}

function createInputKeyDownHandler({
  orderedResults,
  selectedValue,
  onSelectResult,
  moveUp,
  moveDown,
}: Pick<
  ReturnType<typeof useSearchContext>,
  'orderedResults' | 'selectedValue' | 'onSelectResult' | 'moveUp' | 'moveDown'
>) {
  return (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveDown();
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveUp();
        return;
      case 'Enter':
        selectCurrentResult(event, orderedResults, selectedValue, onSelectResult);
        return;
      default:
        return;
    }
  };
}

function selectCurrentResult(
  event: KeyboardEvent<HTMLInputElement>,
  orderedResults: ReturnType<typeof useSearchContext>['orderedResults'],
  selectedValue: string,
  onSelectResult: ReturnType<typeof useSearchContext>['onSelectResult'],
) {
  const selectedResult = orderedResults.find((result) => result.id === selectedValue);
  if (!selectedResult) return;
  event.preventDefault();
  onSelectResult(selectedResult);
}

function resetQuery(
  setQuery: ReturnType<typeof useSearchContext>['setQuery'],
  inputRef: ReturnType<typeof useSearchContext>['inputRef'],
) {
  setQuery('');
  inputRef.current?.focus();
}
