import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { cn } from '../../lib/utils';

/* ============================================================================
 * 1. SprintFinisherSeal — Day 31 Completion Trophy / Telemetry Seal
 * ============================================================================ */
export const SprintFinisherSeal: React.FC<{ className?: string }> = ({
  className = 'h-16 w-16',
}) => {
  const ticks = Array.from({ length: 31 }, (_, i) => {
    const angle = (i / 31) * Math.PI * 2 - Math.PI / 2;
    const x1 = 40 + Math.cos(angle) * 32;
    const y1 = 40 + Math.sin(angle) * 32;
    const x2 = 40 + Math.cos(angle) * 36.5;
    const y2 = 40 + Math.sin(angle) * 36.5;
    return { x1, y1, x2, y2 };
  });

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="38" fill="#121212" />
      <circle cx="40" cy="40" r="37" stroke="#5CE68A" strokeOpacity="0.45" strokeWidth="1.5" />
      {ticks.map((t, idx) => (
        <line
          key={idx}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={idx % 4 === 0 ? '#E6FA72' : '#5CE68A'}
          strokeWidth={idx % 4 === 0 ? '2' : '1.4'}
          strokeLinecap="round"
        />
      ))}
      <circle cx="40" cy="40" r="24" fill="#1E1730" stroke="#5CE68A" strokeWidth="1.75" />
      <text
        x="40"
        y="43"
        textAnchor="middle"
        fill="#E6FA72"
        fontFamily="var(--font-mono, monospace)"
        fontSize="15"
        fontWeight="800"
        letterSpacing="-0.5"
      >
        31D
      </text>
      <text
        x="40"
        y="53"
        textAnchor="middle"
        fill="#5CE68A"
        fontFamily="var(--font-mono, monospace)"
        fontSize="6.5"
        fontWeight="700"
        letterSpacing="1.2"
      >
        SEALED
      </text>
    </svg>
  );
};

/* ============================================================================
 * 2. Hardware Milestone Stamps (AnalyticsDashboard)
 * ============================================================================ */
export interface MilestoneBadgeInput {
  closedDays: number;
  daysLogged: number;
  bestStreak: number;
  overallRate: number;
  hasPerfectGatekeeper: boolean;
  completedCyclesCount: number;
}

interface MilestoneDef {
  id: string;
  code: string;
  title: string;
  description: string;
  unlocked: boolean;
  accent: 'lime' | 'emerald' | 'orchid' | 'amber';
  glyph: (unlocked: boolean) => React.ReactNode;
}

const ACCENT_CLASSES: Record<MilestoneDef['accent'], string> = {
  lime: 'bg-[#E6FA72] text-[#121212] border-[#121212]/15 dark:bg-orchid dark:text-[#0D0914] dark:border-orchid',
  emerald: 'bg-complete text-[#121212] border-complete',
  orchid: 'bg-[#121212] text-[#E6FA72] border-[#121212] dark:bg-orchid dark:text-[#0D0914] dark:border-orchid',
  amber: 'bg-amber text-[#121212] border-amber',
};

export const SprintMilestonesCard: React.FC<{
  metrics: MilestoneBadgeInput;
  className?: string;
}> = ({ metrics, className }) => {
  const { t } = useLanguage();

  const badges: MilestoneDef[] = [
    {
      id: 'first-lock',
      code: 'D01',
      title: t('First Lock'),
      description: t('Close your first day with tomorrow planned'),
      unlocked: metrics.closedDays >= 1,
      accent: 'emerald',
      glyph: (unlocked) => (
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
          <rect
            x="6"
            y="14"
            width="20"
            height="13"
            rx="4"
            fill={unlocked ? 'currentColor' : 'none'}
            fillOpacity={unlocked ? 0.16 : 0}
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M10.5 14V10.5C10.5 7.5 12.9 5.5 16 5.5C19.1 5.5 21.5 7.5 21.5 10.5V14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="16" cy="20.5" r="2" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'seven-day',
      code: '07D',
      title: t('7-Day Ignition'),
      description: t('Reach a 7-day cadence or 7 closed days'),
      unlocked: metrics.bestStreak >= 7 || metrics.closedDays >= 7,
      accent: 'lime',
      glyph: (unlocked) => (
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
          <circle
            cx="16"
            cy="16"
            r="11.5"
            fill={unlocked ? 'currentColor' : 'none'}
            fillOpacity={unlocked ? 0.14 : 0}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 2.5"
          />
          <path
            d="M11.5 11.5H20.5L14.5 21.5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'gatekeeper',
      code: '8/8',
      title: t('Full Gatekeeper'),
      description: t('Plan all 8 pillars for tomorrow in one lock'),
      unlocked: metrics.hasPerfectGatekeeper,
      accent: 'amber',
      glyph: (unlocked) => (
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
            <rect
              key={idx}
              x={4.5 + idx * 3}
              y={9}
              width="2"
              height="14"
              rx="1"
              fill={unlocked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.2"
            />
          ))}
        </svg>
      ),
    },
    {
      id: 'halfway',
      code: '16D',
      title: t('Halfway Telemetry'),
      description: t('Log 16 days inside a 31-day sprint'),
      unlocked: metrics.daysLogged >= 16 || metrics.closedDays >= 16,
      accent: 'orchid',
      glyph: (unlocked) => (
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
          <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16 5A11 11 0 0 1 16 27V5Z"
            fill="currentColor"
            fillOpacity={unlocked ? 0.85 : 0.25}
          />
        </svg>
      ),
    },
    {
      id: 'neural-21',
      code: '21D',
      title: t('21-Day Neural Lock'),
      description: t('Sustain a 21-day streak or 21 closed days'),
      unlocked: metrics.bestStreak >= 21 || metrics.closedDays >= 21,
      accent: 'lime',
      glyph: (unlocked) => (
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
          <polygon
            points="16,4 27,10.5 27,21.5 16,28 5,21.5 5,10.5"
            fill={unlocked ? 'currentColor' : 'none'}
            fillOpacity={unlocked ? 0.14 : 0}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 16.5L14.5 19.5L21 12.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'finisher-31',
      code: '31D',
      title: t('31-Day Finisher'),
      description: t('Seal a complete 31-day sprint cycle'),
      unlocked: metrics.closedDays >= 31 || metrics.completedCyclesCount >= 1,
      accent: 'emerald',
      glyph: (unlocked) => (
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
          <circle
            cx="16"
            cy="16"
            r="11.5"
            fill={unlocked ? 'currentColor' : 'none'}
            fillOpacity={unlocked ? 0.18 : 0}
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="16" cy="16" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="2.2" fill="currentColor" />
        </svg>
      ),
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div
      className={cn(
        'rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6',
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t('Hardware Telemetry Stamps')}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
            {t('Sprint Milestone Badges')}
          </h2>
        </div>
        <span className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sand)] px-3 py-1 font-mono-tabular text-[11px] font-semibold text-[var(--text-primary)]">
          {String(unlockedCount).padStart(2, '0')} / {String(badges.length).padStart(2, '0')} {t('Unlocked')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              'flex flex-col justify-between rounded-[22px] border p-4 transition-colors',
              badge.unlocked
                ? 'border-[var(--border-strong)] bg-[var(--bg-sand)]/55 dark:bg-[#1E1730]'
                : 'border-dashed border-[var(--border-strong)] bg-hatch-fine opacity-70'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border',
                  badge.unlocked
                    ? ACCENT_CLASSES[badge.accent]
                    : 'border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                )}
              >
                {badge.glyph(badge.unlocked)}
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold tracking-[0.1em]',
                  badge.unlocked
                    ? 'bg-[#121212] text-[#E6FA72] dark:bg-orchid dark:text-[#0D0914]'
                    : 'border border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                )}
              >
                {badge.code}
              </span>
            </div>

            <div className="mt-3.5">
              <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                {badge.title}
              </p>
              <p className="mt-1 text-xs leading-snug text-[var(--text-secondary)]">
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
