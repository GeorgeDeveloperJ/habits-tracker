import React from 'react';

export interface BrandIconProps {
  className?: string;
}

export const KrakenHabitsMark: React.FC<BrandIconProps> = ({ className = 'h-5 w-5' }) => (
  <img src="/kraken-habits.webp" alt="" width={40} height={40} decoding="async" className={`${className} object-contain`} />
);

/**
 * "Plan Tonight. Execute Tomorrow." horizon glyph (crescent + sunrise node).
 */
export const HorizonGlyph: React.FC<BrandIconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M4 16.5H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8.5 13.5A4.5 4.5 0 0 1 15.5 13.5"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 4.5V6.5M6.7 7.2L8.1 8.6M17.3 7.2L15.9 8.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="19.5" r="1.4" fill="currentColor" />
  </svg>
);

/**
 * Launchpad inline badge: segmented 01->31 sprint vector.
 */
export const SprintLaunchGlyph: React.FC<BrandIconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="7"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M8.5 12H15.5M12.5 9L15.5 12L12.5 15"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Daily Command inline badge: precision dial / gatekeeper seal.
 */
export const CommandDialGlyph: React.FC<BrandIconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="8.5"
      fill="currentColor"
      fillOpacity="0.14"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="3.5 2.5"
    />
    <path
      d="M8.7 12.2L11 14.5L15.5 9.8"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
