/**
 * Download icon used by the AI Insights prompt button when the prompt is too large to copy.
 */
import { SVGProps } from 'react';

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        d="M8.75 1v7.19l2.22-2.22 1.06 1.06L8 11.06 3.97 7.03l1.06-1.06 2.22 2.22V1h1.5Z"
      />
      <path fill="currentColor" d="M2 12.5h12V14H2z" />
    </svg>
  );
}
