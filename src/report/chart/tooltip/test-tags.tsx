/**
 * Reusable component that renders test tags as compact colored text tokens,
 * with optional query highlighting and optional max-tag truncation.
 */
import { highlightMatch } from '../search/highlight-match.js';

const TAG_COLORS = ['#a78bfa', '#22d3ee', '#fbbf24', '#fb7185', '#34d399'];

/**
 * Renders test tags as inline colored text.
 * Pass `query` to highlight matching text (search results context).
 * Pass `maxTags` to truncate with an ellipsis (tooltip context).
 */
export function TestTags({
  tags,
  query,
  maxTags,
}: {
  tags: string[];
  query?: string;
  maxTags?: number;
}) {
  if (!tags.length) return null;

  const visibleTags = maxTags !== undefined ? tags.slice(0, maxTags) : tags;
  const truncated = maxTags !== undefined && tags.length > maxTags;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px' }}>
      {visibleTags.map((tag, i) => (
        <span
          key={tag}
          style={{ color: TAG_COLORS[i % TAG_COLORS.length], fontSize: 12, fontWeight: 500 }}
        >
          {query ? highlightMatch(tag, query) : tag}
        </span>
      ))}
      {truncated && <span style={{ color: 'var(--tooltip-text-muted)', fontSize: 12 }}>…</span>}
    </div>
  );
}
