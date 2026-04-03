export function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="16" height="16" fill="none" />
      <defs>
        <clipPath id="favicon-b1">
          <rect x="1" y="2" width="9" height="3" rx="1.5" />
        </clipPath>
        <clipPath id="favicon-b2">
          <rect x="4" y="6" width="10" height="3" rx="1.5" />
        </clipPath>
        <clipPath id="favicon-b3">
          <rect x="2" y="10" width="12" height="3" rx="1.5" />
        </clipPath>
      </defs>
      <g clipPath="url(#favicon-b1)">
        <rect x="1" y="2" width="3" height="3" fill="#F2B705" />
        <rect x="4" y="2" width="3" height="3" fill="#3A8DDE" />
        <rect x="7" y="2" width="3" height="3" fill="#2FA84F" />
      </g>
      <g clipPath="url(#favicon-b2)">
        <rect x="4" y="6" width="2.5" height="3" fill="#F2B705" />
        <rect x="6.5" y="6" width="2.5" height="3" fill="#3A8DDE" />
        <rect x="9" y="6" width="2.5" height="3" fill="#E54848" />
        <rect x="11.5" y="6" width="2.5" height="3" fill="#2FA84F" />
      </g>
      <g clipPath="url(#favicon-b3)">
        <rect x="2" y="10" width="3" height="3" fill="#F2B705" />
        <rect x="5" y="10" width="3" height="3" fill="#3A8DDE" />
        <rect x="8" y="10" width="6" height="3" fill="#2FA84F" />
      </g>
    </svg>
  );
}
