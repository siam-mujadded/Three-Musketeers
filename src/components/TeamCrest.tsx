interface TeamCrestProps {
  emblem: string;
  primary: string;
  accent: string;
  size?: number;
}

/**
 * Small heraldic-style emblem used to visually anchor each team across the UI.
 */
export function TeamCrest({ emblem, primary, accent, size = 28 }: TeamCrestProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`shield-${emblem}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={primary} />
          <stop offset="1" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M20 3 L35 8 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 8 Z"
        fill={`url(#shield-${emblem})`}
        stroke={accent}
        strokeWidth="1.2"
      />
      {emblem === 'fleur' && (
        <g transform="translate(20 22)" fill={accent}>
          <path d="M0,-12 C-3,-4 -3,4 0,12 C3,4 3,-4 0,-12 Z" />
          <path d="M-12,0 C-4,-3 4,-3 12,0 C4,3 -4,3 -12,0 Z" />
          <circle r="2.2" fill={primary} />
        </g>
      )}
      {emblem === 'cross' && (
        <g transform="translate(20 20)" fill={accent}>
          <rect x="-2" y="-10" width="4" height="22" rx="1" />
          <rect x="-8" y="-2" width="16" height="4" rx="1" />
          <circle cx="0" cy="-12" r="3" />
        </g>
      )}
      {emblem === 'crown' && (
        <g transform="translate(20 22)" fill={accent} stroke={primary} strokeWidth="0.6">
          <path d="M-12,2 L-8,-8 L-4,0 L0,-12 L4,0 L8,-8 L12,2 Z" />
          <rect x="-12" y="3" width="24" height="4" rx="1" />
          <circle cx="-8" cy="-8" r="1.2" fill={primary} />
          <circle cx="0" cy="-12" r="1.4" fill={primary} />
          <circle cx="8" cy="-8" r="1.2" fill={primary} />
        </g>
      )}
    </svg>
  );
}
