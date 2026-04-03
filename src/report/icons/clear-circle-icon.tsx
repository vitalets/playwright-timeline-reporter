/**
 * Renders the circular clear icon used by the search input reset action.
 */
import type { SVGProps } from 'react';

export function ClearCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="7" />
      <path d="M5.5 5.5L10.5 10.5" />
      <path d="M10.5 5.5L5.5 10.5" />
    </svg>
  );
}
