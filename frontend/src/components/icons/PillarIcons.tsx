import React from 'react';

export interface PillarIconProps {
  className?: string;
}

/**
 * 1. Learning (#8B5CF6) — Open codex with duotone bookmark & spark
 */
export const LearningPillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M3.5 6.2C3.5 5.4 4.1 4.8 4.9 4.8H9.2C10.7 4.8 12 6 12 7.5V19C12 18 10.9 17.3 9.7 17.3H4.9C4.1 17.3 3.5 16.7 3.5 15.9V6.2Z"
      fill="#8B5CF6"
      fillOpacity="0.24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M20.5 6.2C20.5 5.4 19.9 4.8 19.1 4.8H14.8C13.3 4.8 12 6 12 7.5V19C12 18 13.1 17.3 14.3 17.3H19.1C19.9 17.3 20.5 16.7 20.5 15.9V6.2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M15.2 9.2H17.8M15.2 12.2H17.8" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="7.7" cy="9.4" r="1.3" fill="#8B5CF6" />
  </svg>
);

/**
 * 2. Physical Health (#10B981) — Kinetic capsule pulse & vitality core
 */
export const PhysicalPillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3.5"
      y="4.5"
      width="17"
      height="15"
      rx="7.5"
      fill="#10B981"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M6.2 12.2H9L10.7 8.4L13.3 15.6L15 12.2H17.8"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="17.8" cy="12.2" r="1.4" fill="#10B981" />
  </svg>
);

/**
 * 3. Nutrition (#06B6D4) — Hydration vessel & botanical leaf
 */
export const NutritionPillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4.5 11.5H19.5C19.5 15.9 16.2 19.2 12 19.2C7.8 19.2 4.5 15.9 4.5 11.5Z"
      fill="#06B6D4"
      fillOpacity="0.24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M12 11.5C12 8.5 14.3 5.5 17.5 5.2C17.2 8.4 15 11.2 12 11.5Z"
      fill="#06B6D4"
      fillOpacity="0.45"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M8.5 11.5L7.2 6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="9.6" cy="14.7" r="1.2" fill="#06B6D4" />
  </svg>
);

/**
 * 4. Mindfulness (#A78BFA) — Concentric breath halo & calm center
 */
export const MindfulnessPillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="8.2"
      fill="#A78BFA"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeDasharray="3.2 2.4"
    />
    <circle
      cx="12"
      cy="12"
      r="4.8"
      fill="#A78BFA"
      fillOpacity="0.32"
      stroke="currentColor"
      strokeWidth="1.75"
    />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
  </svg>
);

/**
 * 5. Work / Focus (#F59E0B) — Precision optical crosshair
 */
export const FocusPillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="7.5"
      fill="#F59E0B"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M12 2.8V6.2M12 17.8V21.2M2.8 12H6.2M17.8 12H21.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="2.4" fill="#F59E0B" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/**
 * 6. Finance (#34D399) — Ledger card with upward balance bar
 */
export const FinancePillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3.5"
      y="5.5"
      width="17"
      height="13"
      rx="3.5"
      fill="#34D399"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M3.5 9.8H20.5" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M7.5 15V13.6M11 15V12.4M14.5 15V11.8"
      stroke="#34D399"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="17.3" cy="14.2" r="1.2" fill="currentColor" />
  </svg>
);

/**
 * 7. Organization (#60A5FA) — Modular 2x2 Bento matrix with locked corner
 */
export const OrganizationPillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="4"
      y="4"
      width="7"
      height="7"
      rx="2"
      fill="#60A5FA"
      fillOpacity="0.4"
      stroke="currentColor"
      strokeWidth="1.75"
    />
    <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <rect
      x="13"
      y="13"
      width="7"
      height="7"
      rx="3.5"
      fill="#60A5FA"
      fillOpacity="0.28"
      stroke="currentColor"
      strokeWidth="1.75"
    />
  </svg>
);

/**
 * 8. Rest (#C084FC) — Crescent moon & orbital recovery star
 */
export const RestPillarIcon: React.FC<PillarIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M14.8 4.4A7.6 7.6 0 1 0 19.6 15.2A6.2 6.2 0 0 1 14.8 4.4Z"
      fill="#C084FC"
      fillOpacity="0.28"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="17.5" cy="7.5" r="1.4" fill="#C084FC" />
    <path d="M17.5 4.8V5.5M17.5 9.5V10.2M14.8 7.5H15.5M19.5 7.5H20.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
