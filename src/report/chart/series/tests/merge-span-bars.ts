/**
 * Logic to merge spans whose rendered pixel width is below a threshold, and compensate
 * by expanding the adjacent visible span so the total bar area remains visually continuous.
 *
 * Rules:
 * - If a span's pixel width is below TINY_SPAN_WIDTH_PX it is merged.
 * - Consecutive tiny spans are treated as a single group and merged together.
 * - When a group of tiny spans has a visible span before it, that previous span's width
 *   is extended to reach the left edge of the next visible span (absorbing the gap).
 * - When a group of tiny spans is at the very start (no previous span), the next visible
 *   span's left edge is moved backward to cover the gap.
 * - When a tiny group contains an error span, that error remains visible and absorbs
 *   the rest of the tiny group.
 * - If all spans are tiny, one representative span remains visible.
 */

/* eslint-disable visual/complexity, max-statements */
import { SpanBarData } from './span-bar.js';

/** Pixel width below which a span is considered too small to render. */
const TINY_SPAN_WIDTH_PX = 2;

function isTinySpan(width: number) {
  return width <= TINY_SPAN_WIDTH_PX;
}

/**
 * Removes spans whose rendered width is below the threshold and adjusts adjacent spans
 * to fill the visual gap left by the removed spans.
 */
export function mergeSpanBars(spans: SpanBarData[]): SpanBarData[] {
  if (spans.length === 0) return spans;

  // Shallow-copy each item so rect mutations don't affect the original data.
  const result: SpanBarData[] = spans.map((s) => ({ ...s, rect: { ...s.rect } }));

  let i = 0;
  while (i < result.length) {
    if (!isTinySpan(result[i].rect.width)) {
      i++;
      continue;
    }

    // Found a tiny span — walk forward to collect all consecutive tiny spans.
    const groupStart = i;
    while (i < result.length && isTinySpan(result[i].rect.width)) {
      i++;
    }
    // result[groupStart..groupEnd-1] is the contiguous range of tiny spans.
    const groupEnd = i;
    const group = result.slice(groupStart, groupEnd);

    const hasPrev = groupStart > 0;
    const hasNext = groupEnd < result.length;
    const errorSpans = group.filter((spanBar) => spanBar.span.span.error);

    if (errorSpans.length > 0 || (!hasPrev && !hasNext)) {
      const replacement = getReplacementSpan(errorSpans.length > 0 ? errorSpans : group, group);
      result.splice(groupStart, groupEnd - groupStart, replacement);
      i = groupStart + 1;
      continue;
    }

    if (hasPrev) {
      // Extend the previous span's right edge to the left edge of the next visible span,
      // absorbing all the tiny spans in between.
      const prevSpan = result[groupStart - 1];
      if (hasNext) {
        prevSpan.rect.width = result[groupEnd].rect.left - prevSpan.rect.left;
      } else {
        // Tiny spans are at the trailing end — extend prev to their combined right edge.
        const lastTiny = result[groupEnd - 1];
        prevSpan.rect.width = lastTiny.rect.left + lastTiny.rect.width - prevSpan.rect.left;
      }
    } else if (hasNext) {
      // Tiny span(s) are at the very start — move the next span's left edge backward
      // to cover the gap, keeping its right edge in place.
      const nextSpan = result[groupEnd];
      const originalRight = nextSpan.rect.left + nextSpan.rect.width;
      nextSpan.rect.left = result[groupStart].rect.left;
      nextSpan.rect.width = originalRight - nextSpan.rect.left;
    }
    // If neither hasPrev nor hasNext: all spans are tiny and will all be removed.

    // Remove the tiny spans from the working array.
    result.splice(groupStart, groupEnd - groupStart);
    // After splice, the item that was at groupEnd is now at groupStart.
    i = groupStart;
  }

  return result;
}

function getReplacementSpan(candidates: SpanBarData[], group: SpanBarData[]) {
  const replacement = pickWidest(candidates);
  const groupLeft = group[0].rect.left;
  const groupRight = getRectRight(group[group.length - 1]);
  const width = Math.max(TINY_SPAN_WIDTH_PX, groupRight - groupLeft);

  replacement.rect.width = width;
  replacement.rect.left = groupRight - width;
  return replacement;
}

function pickWidest(spans: SpanBarData[]) {
  return spans.reduce((prev, current) => (prev.rect.width > current.rect.width ? prev : current));
}

function getRectRight(span: SpanBarData) {
  return span.rect.left + span.rect.width;
}
