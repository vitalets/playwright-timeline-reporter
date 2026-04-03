import { SVGProps } from 'react';

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path fill="currentColor" d="M0 0h10v4H4v6H0V0Z" />
      <path fill="currentColor" d="M16 6H6v10h10V6Z" />
    </svg>
  );
}
