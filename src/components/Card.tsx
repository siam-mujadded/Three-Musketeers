import { memo } from 'react';
import type { Rank } from '../game/types';

const ROMAN: Record<Rank, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII',
};

const ARCHETYPE: Record<Rank, string> = {
  1: 'Page',
  2: 'Squire',
  3: 'Cadet',
  4: 'Recruit',
  5: 'Duelist',
  6: 'Guard',
  7: 'Musketeer',
  8: 'Officer',
  9: 'Lieutenant',
  10: 'Captain',
  11: 'Cardinal',
  12: 'King',
};

interface CardProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  className?: string;
  dim?: boolean;
}

const SIZE_PX: Record<NonNullable<CardProps['size']>, { w: number; h: number }> = {
  sm: { w: 64, h: 92 },
  md: { w: 96, h: 140 },
  lg: { w: 130, h: 188 },
};

function FleurDeLis({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#c9a24a">
      <path d="M0,-6 C-2,-2 -2,2 0,6 C2,2 2,-2 0,-6 Z" />
      <path d="M-6,0 C-2,-2 2,-2 6,0 C2,2 -2,2 -6,0 Z" />
      <circle cx="0" cy="0" r="1.4" fill="#1b2a5b" />
    </g>
  );
}

function MusketeerSilhouette({ rank }: { rank: Rank }) {
  // Single stylized silhouette varied by rank details (hat plume count, sword length, crown).
  const plume = rank >= 7 ? 3 : rank >= 4 ? 2 : 1;
  const hasCrown = rank === 12;
  const hasCape = rank >= 8;
  const hasDoubleSword = rank >= 10;
  return (
    <g transform="translate(48 70)" fill="#1b2a5b" stroke="#1b2a5b" strokeWidth="0.6">
      {hasCape && (
        <path
          d="M-18,-4 C-22,14 -12,28 0,30 C12,28 22,14 18,-4 C10,2 -10,2 -18,-4 Z"
          fill="#1b2a5b"
          opacity="0.18"
        />
      )}
      {/* Head */}
      <circle cx="0" cy="-28" r="7" />
      {/* Hat brim */}
      <path d="M-14,-32 C-14,-36 14,-36 14,-32 C14,-28 -14,-28 -14,-32 Z" />
      {/* Hat crown */}
      <path d="M-8,-40 C-8,-44 8,-44 8,-40 L8,-32 L-8,-32 Z" />
      {/* Plumes */}
      {Array.from({ length: plume }).map((_, i) => {
        const offset = (i - (plume - 1) / 2) * 4;
        return (
          <path
            key={i}
            d={`M${offset},-42 C${offset - 3},-50 ${offset + 6},-52 ${offset + 2},-58`}
            fill="none"
            stroke="#c9a24a"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        );
      })}
      {hasCrown && (
        <g fill="#e0b957" stroke="#7a5d1e" strokeWidth="0.6">
          <path d="M-10,-44 L-10,-50 L-6,-46 L-2,-52 L2,-46 L6,-52 L10,-46 L10,-44 Z" />
          <circle cx="-6" cy="-52" r="1" />
          <circle cx="0" cy="-54" r="1" />
          <circle cx="6" cy="-52" r="1" />
        </g>
      )}
      {/* Shoulders & torso */}
      <path d="M-14,-18 C-14,-8 -10,0 -8,14 L8,14 C10,0 14,-8 14,-18 C8,-22 -8,-22 -14,-18 Z" />
      {/* Belt */}
      <rect x="-9" y="10" width="18" height="3" fill="#c9a24a" />
      <rect x="-2" y="10" width="4" height="3" fill="#1b2a5b" />
      {/* Sword(s) */}
      <g stroke="#c9a24a" strokeWidth="1.6" strokeLinecap="round">
        <line x1="10" y1="6" x2="28" y2="-12" />
        {hasDoubleSword && <line x1="-10" y1="6" x2="-28" y2="-12" />}
      </g>
      <circle cx="10" cy="6" r="1.6" fill="#e0b957" />
      {hasDoubleSword && <circle cx="-10" cy="6" r="1.6" fill="#e0b957" />}
    </g>
  );
}

function CardInner({ rank }: { rank: Rank }) {
  return (
    <svg viewBox="0 0 96 140" className="w-full h-full" aria-label={`Card rank ${rank}`}>
      <defs>
        <linearGradient id={`bg-${rank}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#faecc4" />
          <stop offset="1" stopColor="#ecd79c" />
        </linearGradient>
        <pattern id={`dots-${rank}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#c9a24a" opacity="0.15" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="96" height="140" rx="8" fill={`url(#bg-${rank})`} />
      <rect x="0" y="0" width="96" height="140" rx="8" fill={`url(#dots-${rank})`} />
      {/* Outer ornate frame */}
      <rect
        x="3"
        y="3"
        width="90"
        height="134"
        rx="6"
        fill="none"
        stroke="#c9a24a"
        strokeWidth="1.4"
      />
      <rect
        x="6"
        y="6"
        width="84"
        height="128"
        rx="5"
        fill="none"
        stroke="#1b2a5b"
        strokeWidth="0.8"
      />
      {/* Corner fleur-de-lis */}
      <FleurDeLis x={12} y={12} scale={0.7} />
      <FleurDeLis x={84} y={12} scale={0.7} />
      <FleurDeLis x={12} y={128} scale={0.7} />
      <FleurDeLis x={84} y={128} scale={0.7} />
      {/* Small corner numerals */}
      <text
        x="10"
        y="26"
        fontFamily="Cinzel, Georgia, serif"
        fontSize="10"
        fontWeight="700"
        fill="#1b2a5b"
      >
        {rank}
      </text>
      <text
        x="86"
        y="120"
        fontFamily="Cinzel, Georgia, serif"
        fontSize="10"
        fontWeight="700"
        fill="#1b2a5b"
        textAnchor="end"
      >
        {rank}
      </text>
      {/* Central silhouette */}
      <MusketeerSilhouette rank={rank} />
      {/* Central Roman numeral */}
      <text
        x="48"
        y="118"
        fontFamily="Cinzel, Georgia, serif"
        fontSize="16"
        fontWeight="900"
        fill="#1b2a5b"
        textAnchor="middle"
        letterSpacing="1"
      >
        {ROMAN[rank]}
      </text>
      {/* Archetype caption */}
      <text
        x="48"
        y="132"
        fontFamily="EB Garamond, Georgia, serif"
        fontSize="7"
        fontStyle="italic"
        fill="#7a5d1e"
        textAnchor="middle"
      >
        {ARCHETYPE[rank]}
      </text>
    </svg>
  );
}

function CardImpl({
  rank,
  size = 'md',
  selected,
  highlighted,
  onClick,
  className,
  dim,
}: CardProps) {
  const { w, h } = SIZE_PX[size];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'no-touch-callout relative inline-block rounded-lg transition-transform',
        onClick ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0' : 'cursor-default',
        selected ? 'ring-4 ring-gold-400 -translate-y-2' : '',
        highlighted ? 'card-highlight -translate-y-1' : '',
        dim ? 'opacity-40' : '',
        className ?? '',
      ].join(' ')}
      style={{
        width: w,
        height: h,
        boxShadow: highlighted
          ? '0 0 0 3px #e0b957, 0 0 24px rgba(224,185,87,0.75), 0 10px 22px rgba(0,0,0,0.45)'
          : '0 8px 20px rgba(0,0,0,0.35)',
      }}
      disabled={!onClick}
    >
      {highlighted && (
        <div
          aria-hidden="true"
          className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full font-display tracking-widest text-[9px] uppercase whitespace-nowrap"
          style={{
            background: '#5a1825',
            color: '#ffd99a',
            border: '1px solid #e0b957',
            boxShadow: '0 0 10px rgba(224,185,87,0.75)',
          }}
        >
          new · from swap
        </div>
      )}
      <CardInner rank={rank} />
    </button>
  );
}

export const Card = memo(CardImpl);
