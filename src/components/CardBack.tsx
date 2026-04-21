interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_PX: Record<NonNullable<CardBackProps['size']>, { w: number; h: number }> = {
  sm: { w: 64, h: 92 },
  md: { w: 96, h: 140 },
  lg: { w: 130, h: 188 },
};

export function CardBack({ size = 'md', className }: CardBackProps) {
  const { w, h } = SIZE_PX[size];
  return (
    <div
      className={['no-touch-callout inline-block rounded-lg', className ?? ''].join(' ')}
      style={{ width: w, height: h, boxShadow: '0 8px 20px rgba(0,0,0,0.45)' }}
    >
      <svg viewBox="0 0 96 140" className="w-full h-full">
        <defs>
          <linearGradient id="back-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f3066" />
            <stop offset="1" stopColor="#0a132e" />
          </linearGradient>
          <pattern id="back-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M6 0 L12 6 L6 12 L0 6 Z" fill="none" stroke="#c9a24a" strokeWidth="0.4" opacity="0.35" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="96" height="140" rx="8" fill="url(#back-bg)" />
        <rect x="0" y="0" width="96" height="140" rx="8" fill="url(#back-grid)" />
        <rect x="4" y="4" width="88" height="132" rx="6" fill="none" stroke="#c9a24a" strokeWidth="1.4" />
        <rect x="7" y="7" width="82" height="126" rx="5" fill="none" stroke="#e0b957" strokeWidth="0.5" opacity="0.6" />
        {/* Central medallion */}
        <g transform="translate(48 70)">
          <circle r="28" fill="#0a132e" stroke="#c9a24a" strokeWidth="1.2" />
          <circle r="22" fill="none" stroke="#c9a24a" strokeWidth="0.5" opacity="0.6" />
          {/* Crossed rapiers */}
          <g stroke="#e0b957" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <line x1="-18" y1="-18" x2="18" y2="18" />
            <line x1="18" y1="-18" x2="-18" y2="18" />
          </g>
          {/* Hilts */}
          <circle cx="-18" cy="-18" r="2.4" fill="#e0b957" />
          <circle cx="18" cy="-18" r="2.4" fill="#e0b957" />
          {/* Fleur-de-lis center */}
          <g fill="#e0b957">
            <path d="M0,-10 C-2.5,-4 -2.5,4 0,10 C2.5,4 2.5,-4 0,-10 Z" />
            <path d="M-10,0 C-4,-2.5 4,-2.5 10,0 C4,2.5 -4,2.5 -10,0 Z" />
            <circle r="1.8" fill="#1b2a5b" />
          </g>
        </g>
        {/* Motto ribbon */}
        <g>
          <path
            d="M10 108 Q48 100 86 108 L86 122 Q48 130 10 122 Z"
            fill="#c9a24a"
            stroke="#7a5d1e"
            strokeWidth="0.6"
          />
          <text
            x="48"
            y="119"
            fontFamily="Cinzel, Georgia, serif"
            fontSize="7"
            fontWeight="700"
            fill="#1a060a"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            UN POUR TOUS
          </text>
        </g>
      </svg>
    </div>
  );
}
