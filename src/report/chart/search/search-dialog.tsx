/**
 * Root search dialog component: wraps everything in SearchProvider and renders
 * the trigger button plus a portal overlay with the cmdk panel.
 */
import { createPortal } from 'react-dom';
import { Command } from 'cmdk';
import { SearchProvider, useSearchContext } from './search-context.js';
import { SearchTrigger } from './search-trigger.js';
import { SearchDialogHeader } from './search-dialog-header.js';
import { SearchInput } from './search-input.js';
import { SearchResults } from './search-results.js';

export function SearchDialog() {
  return (
    <SearchProvider>
      <SearchTrigger />
      <SearchDialogPortal />
    </SearchProvider>
  );
}

function SearchDialogPortal() {
  const { isOpen, isClosing, closeDialog, selectedValue, setSelectedValue } = useSearchContext();

  if (!isOpen) return null;

  return createPortal(
    <div
      className="search-dialog-overlay"
      data-state={isClosing ? 'closing' : 'open'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <Command
        shouldFilter={false}
        value={selectedValue}
        onValueChange={setSelectedValue}
        className="search-dialog-panel search-dialog-root"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeDialog();
          }
        }}
      >
        <SearchDialogHeader />
        <SearchInput />
        <SearchResults />
      </Command>
    </div>,
    document.body,
  );
}
