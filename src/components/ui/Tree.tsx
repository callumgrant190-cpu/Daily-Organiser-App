import type { TreeSpecies } from '../../types';

const PALETTE: Record<TreeSpecies, { canopy: string; canopyDark: string; canopyLight: string }> = {
  oak: { canopy: '#22c55e', canopyDark: '#15803d', canopyLight: '#4ade80' },
  pine: { canopy: '#0e9f6e', canopyDark: '#057a55', canopyLight: '#31c48d' },
  cherry: { canopy: '#f9a8d4', canopyDark: '#ec4899', canopyLight: '#fbcfe8' },
  maple: { canopy: '#fb923c', canopyDark: '#ea580c', canopyLight: '#fdba74' },
  willow: { canopy: '#a3e635', canopyDark: '#65a30d', canopyLight: '#bef264' },
};

interface Props {
  species: TreeSpecies;
  /** 0 = seed, 1 = fully grown. */
  growth: number;
  alive?: boolean;
  size?: number;
  className?: string;
}

/** An SVG tree that grows from a sprout to a full canopy as `growth` → 1. */
export function Tree({ species, growth, alive = true, size = 120, className }: Props) {
  const g = Math.max(0, Math.min(1, growth));
  const p = alive ? PALETTE[species] : { canopy: '#a8a29e', canopyDark: '#78716c', canopyLight: '#d6d3d1' };

  // Trunk grows in height; canopy scales up from the trunk top.
  const trunkH = 18 + g * 34; // 18 → 52
  const trunkTopY = 96 - trunkH;
  const canopyScale = 0.25 + g * 0.95;

  const isPine = species === 'pine';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${alive ? '' : 'withered '}${species} tree`}
    >
      {/* soil mound */}
      <ellipse cx="50" cy="96" rx="26" ry="5" fill="#0b1120" opacity="0.5" />
      <ellipse cx="50" cy="95" rx="22" ry="4" fill="#3f2d1e" />

      {/* trunk */}
      <rect
        x={47.5}
        y={trunkTopY}
        width={5}
        height={trunkH}
        rx={2.4}
        fill={alive ? '#92400e' : '#57534e'}
      />

      <g
        transform={`translate(50 ${trunkTopY}) scale(${canopyScale}) translate(-50 -50)`}
        style={{ transition: 'transform 0.5s ease' }}
      >
        {isPine ? (
          <>
            <polygon points="50,8 30,46 70,46" fill={p.canopyDark} />
            <polygon points="50,20 28,58 72,58" fill={p.canopy} />
            <polygon points="50,34 26,70 74,70" fill={p.canopyLight} />
          </>
        ) : (
          <>
            <circle cx="50" cy="44" r="24" fill={p.canopyDark} />
            <circle cx="34" cy="50" r="18" fill={p.canopy} />
            <circle cx="66" cy="50" r="18" fill={p.canopyLight} />
            <circle cx="50" cy="36" r="20" fill={p.canopy} />
          </>
        )}
        {species === 'cherry' && alive && (
          <>
            <circle cx="30" cy="40" r="2.4" fill="#fff" opacity="0.85" />
            <circle cx="62" cy="34" r="2.4" fill="#fff" opacity="0.85" />
            <circle cx="48" cy="56" r="2.4" fill="#fff" opacity="0.85" />
          </>
        )}
      </g>
    </svg>
  );
}

/** A tiny seedling used as the timer's starting state. */
export function Seedling({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      <ellipse cx="50" cy="92" rx="20" ry="4" fill="#3f2d1e" />
      <path d="M50 92 C50 78 50 70 50 64" stroke="#65a30d" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 70 C42 66 38 60 39 53 C47 54 51 60 50 70 Z" fill="#4ade80" />
      <path d="M50 76 C58 72 62 66 61 59 C53 60 49 66 50 76 Z" fill="#22c55e" />
    </svg>
  );
}
