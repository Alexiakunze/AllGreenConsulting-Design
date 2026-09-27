import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

type P = SVGProps<SVGSVGElement>;

export const Icon = {
  content: (p: P) => (
    <svg {...base(p)}>
      <path d="M5 5h14M5 10h14M5 15h9M5 20h6" />
    </svg>
  ),
  slides: (p: P) => (
    <svg {...base(p)}>
      <rect x="3" y="5" width="7" height="14" rx="1.5" />
      <rect x="14" y="5" width="7" height="14" rx="1.5" />
    </svg>
  ),
  brand: (p: P) => (
    <svg {...base(p)}>
      <path d="M5 21V11a7 7 0 0 1 14 0v10" />
      <path d="M9.5 21v-9.5a2.5 2.5 0 0 1 5 0V21" />
    </svg>
  ),
  elements: (p: P) => (
    <svg {...base(p)}>
      <circle cx="7.5" cy="7.5" r="3.5" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <path d="M4 20l4-6 4 6zM14 17h7" />
    </svg>
  ),
  export: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
    </svg>
  ),
  undo: (p: P) => (
    <svg {...base(p)}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  ),
  redo: (p: P) => (
    <svg {...base(p)}>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H10a6 6 0 0 0 0 12h3" />
    </svg>
  ),
  grid: (p: P) => (
    <svg {...base(p)}>
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  ),
  magnet: (p: P) => (
    <svg {...base(p)}>
      <path d="M6 3v8a6 6 0 0 0 12 0V3M6 7h4M14 7h4" />
    </svg>
  ),
  wand: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 20L16 8M14 4l1.5 1.5M19 9l1.5 1.5M18 3v3M21 6h-3" />
    </svg>
  ),
  eye: (p: P) => (
    <svg {...base(p)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (p: P) => (
    <svg {...base(p)}>
      <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    </svg>
  ),
  lock: (p: P) => (
    <svg {...base(p)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  unlock: (p: P) => (
    <svg {...base(p)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" />
    </svg>
  ),
  copy: (p: P) => (
    <svg {...base(p)}>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  trash: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  ),
  plus: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  up: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  ),
  down: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  ),
  top: (p: P) => (
    <svg {...base(p)}>
      <path d="M5 4h14M12 20V8M7 13l5-5 5 5" />
    </svg>
  ),
  bottom: (p: P) => (
    <svg {...base(p)}>
      <path d="M5 20h14M12 4v12M7 11l5 5 5-5" />
    </svg>
  ),
  alignLeft: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
    </svg>
  ),
  alignCenter: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />
    </svg>
  ),
  alignRight: (p: P) => (
    <svg {...base(p)}>
      <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />
    </svg>
  ),
  play: (p: P) => (
    <svg {...base(p)}>
      <path d="M7 4l13 8-13 8z" />
    </svg>
  ),
  back: (p: P) => (
    <svg {...base(p)}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  next: (p: P) => (
    <svg {...base(p)}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  image: (p: P) => (
    <svg {...base(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </svg>
  ),
  text: (p: P) => (
    <svg {...base(p)}>
      <path d="M5 6V4h14v2M12 4v16M9 20h6" />
    </svg>
  ),
  save: (p: P) => (
    <svg {...base(p)}>
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v5h7M8 21v-7h8v7" />
    </svg>
  ),
  upload: (p: P) => (
    <svg {...base(p)}>
      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
    </svg>
  ),
  close: (p: P) => (
    <svg {...base(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  crop: (p: P) => (
    <svg {...base(p)}>
      <path d="M6 2v16h16M2 6h16v16" />
    </svg>
  ),
  drag: (p: P) => (
    <svg {...base(p)}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  ),
};

/** Interface mark (the app symbol, not the official logo) */
export function AppMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="#12403C" />
      <path d="M8 26V14a8 8 0 0 1 16 0v12h-5V14a3 3 0 0 0-6 0v12z" fill="#C04E01" />
    </svg>
  );
}
