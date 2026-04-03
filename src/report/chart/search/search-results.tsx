/**
 * Scrollable results list with group headings and highlighted match items.
 * SearchResultItem is tightly coupled to this list and kept in the same file.
 */
import { Command } from 'cmdk';
import { GROUP_ORDER, useSearchContext } from './search-context.js';
import { SearchResult } from './search-data.js';
import { highlightMatch } from './highlight-match.js';
import { TestTags } from '../tooltip/test-tags.js';

export function SearchResults() {
  const { groupedResults } = useSearchContext();

  return (
    <Command.List className="search-dialog-list">
      <Command.Empty className="search-dialog-empty">No results</Command.Empty>
      {GROUP_ORDER.map((group) => {
        const results = groupedResults.get(group);
        if (!results?.length) return null;
        return (
          <Command.Group key={group} heading={group} className="search-dialog-group">
            {results.map((result) => (
              <SearchResultItem key={result.id} result={result} />
            ))}
          </Command.Group>
        );
      })}
    </Command.List>
  );
}

function SearchResultItem({ result }: { result: SearchResult }) {
  const { selectedValue, debouncedQuery, onSelectResult, itemRefs } = useSearchContext();
  const isSelected = result.id === selectedValue;

  return (
    <Command.Item
      ref={(node) => {
        itemRefs.current[result.id] = node;
      }}
      value={result.id}
      className={getItemClassName(isSelected)}
      style={getSelectedItemStyle(isSelected)}
      onSelect={() => onSelectResult(result)}
      keywords={[result.searchText]}
    >
      <div className="search-dialog-item-label">{highlightMatch(result.label, debouncedQuery)}</div>
      <SearchResultDetails result={result} debouncedQuery={debouncedQuery} />
    </Command.Item>
  );
}

function SearchResultDetails({
  result,
  debouncedQuery,
}: {
  result: SearchResult;
  debouncedQuery: string;
}) {
  return (
    <>
      <SecondaryLine text={result.preHeader} query={debouncedQuery} />
      {result.tags && <TestTags tags={result.tags} query={debouncedQuery} />}
      <SecondaryLine text={result.filePath} query={debouncedQuery} />
    </>
  );
}

function SecondaryLine({ text, query }: { text?: string; query: string }) {
  if (!text) return null;
  return <div className="search-dialog-item-secondary">{highlightMatch(text, query)}</div>;
}

function getItemClassName(isSelected: boolean) {
  return `search-dialog-item${isSelected ? ' search-dialog-item-active' : ''}`;
}

function getSelectedItemStyle(isSelected: boolean) {
  if (!isSelected) return undefined;
  return {
    borderColor: 'var(--reset-zoom-button-border)',
    background: 'var(--reset-zoom-button-bg)',
    boxShadow: 'inset 0 0 0 1px var(--reset-zoom-button-border)',
  };
}
