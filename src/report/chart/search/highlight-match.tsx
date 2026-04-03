/**
 * Utility function to highlight a query substring within a text string for search results.
 */

export function highlightMatch(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return text;

  const lowerText = text.toLowerCase();
  const startIndex = lowerText.indexOf(normalizedQuery);
  if (startIndex === -1) return text;

  const endIndex = startIndex + normalizedQuery.length;
  return (
    <>
      {text.slice(0, startIndex)}
      <mark className="search-dialog-mark">{text.slice(startIndex, endIndex)}</mark>
      {text.slice(endIndex)}
    </>
  );
}
