import { useLanguage } from '../../i18n/useLanguage';
import { translatePillarText } from '../../i18n/messages';
import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { CORE_PILLARS } from '../../lib/pillars';

/* ============================================================================
 * 1. SegmentedBattery — Hardware pill matrix / capacity meter
 * ============================================================================ */
export interface SegmentedBatteryProps {
  total?: number;
  filled: number;
  label?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'contrast' | 'accent';
  className?: string;
}

export const SegmentedBattery = React.memo<SegmentedBatteryProps>(({
  total = 8,
  filled,
  label,
  showCount = true,
  size = 'md',
  variant = 'default',
  className,
}) => {
  const safeTotal = Number.isFinite(total) ? Math.max(1, Math.floor(total)) : 1;
  const safeFilled = Number.isFinite(filled)
    ? Math.max(0, Math.min(safeTotal, Math.floor(filled)))
    : 0;
  const clampedTotal = safeTotal;
  const clampedFilled = safeFilled;
  const isComplete = clampedFilled >= clampedTotal;

  const sizeMap = {
    sm: { cap: 'h-6 w-2.5', dot: 'h-1 w-1', gap: 'gap-1' },
    md: { cap: 'h-9 w-3.5', dot: 'h-1.5 w-1.5', gap: 'gap-1 sm:gap-1.5' },
    lg: { cap: 'h-12 w-4', dot: 'h-1.5 w-1.5', gap: 'gap-1.5 sm:gap-2' },
  }[size];

  const getCapsuleStyle = (isFilled: boolean) => {
    if (variant === 'contrast') {
      if (isFilled) {
        return isComplete
          ? 'bg-complete border-complete'
          : 'bg-[#E6FA72] border-[#E6FA72] dark:bg-orchid dark:border-orchid';
      }
      return 'border border-white/20 bg-white/[0.04] [background-image:repeating-linear-gradient(-45deg,rgba(255,255,255,0.14),rgba(255,255,255,0.14)_1.5px,transparent_1.5px,transparent_5px)]';
    }

    if (variant === 'accent') {
      if (isFilled) {
        return 'bg-[#121212] border-[#121212] dark:bg-[#0D0914] dark:border-[#0D0914]';
      }
      return 'border border-[#121212]/25 bg-black/5 [background-image:repeating-linear-gradient(-45deg,rgba(18,18,18,0.16),rgba(18,18,18,0.16)_1.5px,transparent_1.5px,transparent_5px)]';
    }

    if (isFilled) {
      return isComplete
        ? 'bg-complete border-complete'
        : 'bg-[#121212] border-[#121212] dark:bg-orchid dark:border-orchid';
    }
    return 'border border-[var(--border-strong)] bg-transparent bg-hatch-fine';
  };

  const getDotStyle = () => {
    if (variant === 'contrast') {
      return 'bg-[#121212] dark:bg-[#0D0914]';
    }
    if (variant === 'accent') {
      return 'bg-[#E6FA72] dark:bg-amber';
    }
    return isComplete ? 'bg-[#121212]' : 'bg-[#E6FA72] dark:bg-[#0D0914]';
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {(label || showCount) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="min-w-0 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75">
              {label}
            </span>
          )}
          {showCount && (
            <span className="shrink-0 whitespace-nowrap font-mono-tabular text-xs font-semibold">
              {String(clampedFilled).padStart(2, '0')} / {String(clampedTotal).padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      <div
        className={cn('flex items-center', sizeMap.gap)}
        role="progressbar"
        aria-valuenow={clampedFilled}
        aria-valuemin={0}
        aria-valuemax={clampedTotal}
      >
        {Array.from({ length: clampedTotal }, (_, idx) => {
          const isFilled = idx < clampedFilled;
          return (
            <div
              key={idx}
              className={cn(
                'relative flex flex-col items-center justify-start rounded-full border pt-1.5 transition-all duration-200',
                sizeMap.cap,
                getCapsuleStyle(isFilled)
              )}
            >
              {isFilled && (
                <span className={cn('rounded-full', sizeMap.dot, getDotStyle())} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ============================================================================
 * 2. CapsuleBarChart — Vertical stadium bars with dashed ghost-tracks & dots
 * ============================================================================ */
export interface CapsuleBarDatum {
  id: string | number;
  label: string;
  value: number;
  max?: number;
  state?: 'active' | 'closed' | 'today' | 'tomorrow' | 'empty' | 'projected' | 'hatched' | 'muted';
  meta?: string;
}

export interface CapsuleBarChartProps {
  data: CapsuleBarDatum[];
  height?: number;
  showDots?: boolean;
  onBarClick?: (id: string | number) => void;
  className?: string;
}

export const CapsuleBarChart = React.memo<CapsuleBarChartProps>(({
  data,
  height = 196,
  showDots = true,
  onBarClick,
  className,
}) => {
  const { t, formatPercent } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const hoveredItem = data.find((d) => d.id === hoveredId) ?? null;

  const hoveredSafeValue = hoveredItem
    ? Number.isFinite(hoveredItem.value)
      ? Math.max(0, hoveredItem.value)
      : 0
    : 0;
  const hoveredHasCustomMax =
    hoveredItem !== null &&
    typeof hoveredItem.max === 'number' &&
    Number.isFinite(hoveredItem.max) &&
    hoveredItem.max > 0 &&
    hoveredItem.max !== 100;
  const safeChartHeight = Number.isFinite(height) && height > 0 ? height : 196;

  const getFillClass = (item: CapsuleBarDatum, ratio: number) => {
    if (
      item.state === 'empty' ||
      item.state === 'projected' ||
      item.state === 'hatched' ||
      ratio <= 0
    ) {
      return 'bg-hatch border border-[var(--border-strong)]';
    }
    if (item.state === 'muted') {
      return 'bg-[var(--text-muted)]/25 border border-[var(--border-hairline)] text-[var(--text-secondary)] dark:bg-white/15';
    }
    if (item.state === 'closed') {
      return 'bg-complete text-[#121212]';
    }
    if (item.state === 'today') {
      return 'bg-[#E6FA72] text-[#121212] dark:bg-orchid dark:text-[#0D0914]';
    }
    if (item.state === 'tomorrow') {
      return 'bg-amber text-[#121212]';
    }
    if (ratio >= 0.75) {
      return 'bg-complete text-[#121212]';
    }
    return 'bg-[#121212] text-[#F4F4F2] dark:bg-orchid dark:text-[#0D0914]';
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Flat telemetry readout bar */}
      <div className="flex min-h-6 items-center justify-between gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-3.5 py-1 dark:bg-[#120D1D]">
        <span className="min-w-0 truncate font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {hoveredItem ? hoveredItem.label : t("Telemetry Readout")}
        </span>
        <span className="shrink-0 font-mono-tabular text-[11px] font-semibold text-[var(--text-primary)]">
          {hoveredItem
            ? `${hoveredHasCustomMax ? `${hoveredSafeValue}/${hoveredItem.max}` : formatPercent(hoveredSafeValue)}${hoveredItem.meta ? ` · ${hoveredItem.meta}` : ''}`
            : t("Hover bar to inspect")}
        </span>
      </div>

      {/* Stadium Bar Columns */}
      <div className="overflow-x-auto pb-1">
        <div
          className={cn(
            'flex items-end justify-between gap-1.5 sm:gap-2',
            data.length <= 12 && 'min-w-[460px]'
          )}
          style={{ height: safeChartHeight }}
        >
          {data.map((item) => {
            const safeValue = Number.isFinite(item.value) ? Math.max(0, item.value) : 0;
            const safeMax =
              typeof item.max === 'number' && Number.isFinite(item.max) && item.max > 0
                ? item.max
                : 100;
            const ratio = Math.max(0, Math.min(1, safeValue / safeMax));
            const isEmpty =
              item.state === 'empty' ||
              item.state === 'projected' ||
              item.state === 'hatched' ||
              safeValue <= 0;
            const fillPct = isEmpty ? 100 : Math.max(18, Math.round(ratio * 100));
            const isHovered = hoveredId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(item.id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => onBarClick?.(item.id)}
                className={cn(
                  'group flex h-full min-w-0 flex-1 flex-col items-center gap-2 focus:outline-none',
                  onBarClick ? 'cursor-pointer' : 'cursor-default'
                )}
                aria-label={`${item.label}: ${safeValue}${item.meta ? `, ${item.meta}` : ''}`}
                title={item.label}
              >
                {/* Dashed Ghost Track */}
                <div
                  className={cn(
                    'relative flex w-full max-w-[34px] flex-1 items-end overflow-hidden rounded-full border border-dashed p-[3px] transition-colors',
                    isHovered
                      ? 'border-[var(--text-primary)]'
                      : 'border-[var(--border-strong)]'
                  )}
                >
                  {/* Capsule Fill */}
                  <div
                    className={cn(
                      'relative flex w-full flex-col items-center justify-start rounded-full pt-1.5 transition-all duration-300',
                      getFillClass(item, ratio)
                    )}
                    style={{ height: `${fillPct}%` }}
                  >
                    {showDots && !isEmpty && (
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          item.state === 'active' && ratio < 0.75
                            ? 'bg-[#E6FA72] dark:bg-[#0D0914]'
                            : item.state === 'muted'
                            ? 'bg-[var(--text-secondary)]'
                            : 'bg-[#121212] dark:bg-[#0D0914]'
                        )}
                      />
                    )}
                  </div>
                </div>

                <span
                  className={cn(
                    'max-w-full truncate font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors',
                    isHovered ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ============================================================================
 * 3. ConcentricRing — Thick hardware SVG telemetry gauge
 * ============================================================================ */
export interface ConcentricRingProps {
  percentage: number;
  secondaryPercentage?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  variant?: 'default' | 'accent' | 'contrast';
  className?: string;
}

export const ConcentricRing = React.memo<ConcentricRingProps>(({
  percentage,
  secondaryPercentage,
  size = 116,
  strokeWidth = 10,
  label,
  sublabel,
  variant = 'default',
  className,
}) => {
  const { formatPercent } = useLanguage();
  const safeSize = Number.isFinite(size) && size > 0 ? size : 116;
  const safeStroke = Number.isFinite(strokeWidth) && strokeWidth > 0 ? strokeWidth : 10;
  const safePercentage = Number.isFinite(percentage) ? percentage : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(safePercentage)));
  const center = safeSize / 2;
  const effectiveStroke = Math.min(safeStroke, Math.max(1, center - 2));
  const outerRadius = Math.max(1, center - effectiveStroke);
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerOffset = outerCircumference - (clamped / 100) * outerCircumference;

  const hasInner =
    typeof secondaryPercentage === 'number' && Number.isFinite(secondaryPercentage);
  const clampedInner = hasInner
    ? Math.max(0, Math.min(100, Math.round(secondaryPercentage)))
    : 0;
  const innerStroke = Math.max(5, effectiveStroke - 3);
  const innerRadius = outerRadius - effectiveStroke - 5;
  const innerCircumference = innerRadius > 0 ? 2 * Math.PI * innerRadius : 0;
  const innerOffset =
    innerRadius > 0
      ? innerCircumference - (clampedInner / 100) * innerCircumference
      : 0;

  const trackColor =
    variant === 'accent'
      ? 'rgba(18, 18, 18, 0.14)'
      : variant === 'contrast'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'var(--border-strong)';

  const primaryStroke =
    variant === 'accent'
      ? '#121212'
      : variant === 'contrast'
      ? 'var(--accent-primary)'
      : clamped >= 75
      ? 'var(--accent-complete)'
      : 'currentColor';

  return (
    <div className={cn('inline-flex flex-col items-center justify-center', className)}>
      <div
        className="relative flex items-center justify-center text-[#121212] dark:text-orchid"
        style={{ width: safeSize, height: safeSize }}
      >
        <svg
          className="-rotate-90"
          width={safeSize}
          height={safeSize}
          viewBox={`0 0 ${safeSize} ${safeSize}`}
        >
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            stroke={trackColor}
            strokeWidth={effectiveStroke}
            fill="none"
          />
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            stroke={primaryStroke}
            strokeWidth={effectiveStroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={outerCircumference}
            strokeDashoffset={outerOffset}
            className="transition-all duration-500"
          />
          {hasInner && innerRadius > 12 && (
            <>
              <circle
                cx={center}
                cy={center}
                r={innerRadius}
                stroke={trackColor}
                strokeWidth={innerStroke}
                fill="none"
              />
              <circle
                cx={center}
                cy={center}
                r={innerRadius}
                stroke="var(--accent-plan)"
                className={cn('transition-all duration-500', variant === 'accent' && 'dark:stroke-[#46364F]')}
                strokeWidth={innerStroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={innerCircumference}
                strokeDashoffset={innerOffset}
              />
            </>
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={cn(
              'font-mono-tabular font-bold tracking-[-0.03em]',
              safeSize >= 110 ? 'text-2xl' : 'text-base',
              variant === 'contrast'
                ? 'text-[#F4F4F2]'
                : variant === 'accent'
                ? 'text-[#121212]'
                : 'text-[var(--text-primary)]'
            )}
          >
            {formatPercent(clamped)}
          </span>
          {sublabel && (
            <span
              className={cn(
                'font-mono-tabular text-[9px] uppercase tracking-[0.12em]',
                variant === 'contrast'
                  ? 'text-[#F4F4F2]/75 dark:text-[#F7F5FF]/75'
                  : variant === 'accent'
                  ? 'text-[#121212]/75 dark:text-[#0D0914]/75'
                  : 'text-[var(--text-muted)]'
              )}
            >
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="mt-2 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {label}
        </span>
      )}
    </div>
  );
});

/* ============================================================================
 * 4. DotMatrixRibbon — 31 tactile stadium capsule nodes
 * ============================================================================ */
export interface DotMatrixDay {
  dayNumber: number;
  isClosed?: boolean;
  isToday?: boolean;
  isTomorrow?: boolean;
  isLogged?: boolean;
  isSelected?: boolean;
  completionRate?: number;
}

export interface DotMatrixRibbonProps {
  days: DotMatrixDay[];
  onSelectDay?: (dayNumber: number) => void;
  interactive?: boolean;
  compact?: boolean;
  className?: string;
}

export const DotMatrixRibbon = React.memo<DotMatrixRibbonProps>(({
  days,
  onSelectDay,
  interactive = true,
  compact = false,
  className,
}) => {
  const { t } = useLanguage();
  return (
    <div className={cn('@container', className)}>
      <div
        className={cn(
          'grid gap-1.5',
          compact
            ? 'grid-cols-6 @[220px]:grid-cols-7 @[280px]:grid-cols-8 @[360px]:grid-cols-11'
            : 'grid-cols-7 @[280px]:grid-cols-8 @[380px]:grid-cols-11 @[520px]:grid-cols-16'
        )}
      >
      {days.map((d, idx) => {
        const safeDayNumber = Number.isFinite(d.dayNumber)
          ? Math.max(1, Math.floor(d.dayNumber))
          : idx + 1;

        let style =
          'border border-[var(--border-hairline)] bg-hatch-fine text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]';

        if (d.isClosed) {
          style =
            'border border-complete bg-complete text-[#121212] hover:opacity-90';
        } else if (d.isToday) {
          style =
            'border border-[#121212] bg-[#121212] text-[#E6FA72] dark:border-orchid dark:bg-orchid dark:text-[#0D0914]';
        } else if (d.isTomorrow) {
          style =
            'border border-dashed border-[#D98200] bg-amber/20 text-[#9A5B00] dark:border-amber dark:text-amber';
        } else if (d.isLogged) {
          style =
            'border border-[var(--border-strong)] bg-[var(--bg-sand)] text-[var(--text-primary)]';
        }

        const content = (
          <>
            <span>{String(safeDayNumber).padStart(2, '0')}</span>
            <span
              className={cn(
                'h-1 w-1 rounded-full',
                d.isToday
                  ? 'bg-[#E6FA72] dark:bg-[#0D0914]'
                  : d.isClosed
                  ? 'bg-[#121212]'
                  : d.isTomorrow
                  ? 'bg-[#D98200] dark:bg-amber'
                  : 'bg-transparent'
              )}
            />
          </>
        );

        const sharedClasses = cn(
          'relative flex flex-col items-center justify-center gap-0.5 rounded-full font-mono-tabular text-[11px] font-semibold transition-all',
          compact ? 'h-9' : 'h-10',
          style,
          d.isSelected && !d.isToday
            ? 'ring-2 ring-[#121212] dark:ring-amber'
            : ''
        );

        if (!interactive || !onSelectDay) {
          return (
            <div
              key={`${safeDayNumber}-${idx}`}
              className={sharedClasses}
              title={t("Day {0}{1}{2}", safeDayNumber, d.isToday ? t(' (Today)') : '', d.isClosed ? t(' · Closed') : '')}
            >
              {content}
            </div>
          );
        }

        return (
          <button
            key={`${safeDayNumber}-${idx}`}
            type="button"
            onClick={() => onSelectDay(safeDayNumber)}
            className={cn(sharedClasses, 'cursor-pointer')}
            title={t("Day {0}{1}{2}", safeDayNumber, d.isToday ? t(' (Today)') : '', d.isClosed ? t(' · Closed') : '')}
          >
            {content}
          </button>
        );
      })}
      </div>
    </div>
  );
});

/* ============================================================================
 * 5. PillarCompassDiagram — 2D vector 8-pillar diagram + frosted glass pills
 * ============================================================================ */
export interface PillarCompassDiagramProps {
  activePillarIndex?: number;
  className?: string;
}

interface CompassSlot {
  style: React.CSSProperties;
  isSide: boolean;
}

const COMPASS_SLOTS: CompassSlot[] = [
  { style: { top: '5%', left: '50%', transform: 'translateX(-50%)' }, isSide: false }, // Top: Learning
  { style: { top: '22%', right: '2%', transform: 'translateY(-50%)' }, isSide: true }, // Top-Right: Physical
  { style: { top: '50%', right: '2%', transform: 'translateY(-50%)' }, isSide: true }, // Right: Nutrition
  { style: { top: '78%', right: '2%', transform: 'translateY(-50%)' }, isSide: true }, // Bottom-Right: Mindfulness
  { style: { bottom: '5%', left: '50%', transform: 'translateX(-50%)' }, isSide: false }, // Bottom: Focus
  { style: { top: '78%', left: '2%', transform: 'translateY(-50%)' }, isSide: true }, // Bottom-Left: Finance
  { style: { top: '50%', left: '2%', transform: 'translateY(-50%)' }, isSide: true }, // Left: Order
  { style: { top: '22%', left: '2%', transform: 'translateY(-50%)' }, isSide: true }, // Top-Left: Rest
];

const COMPASS_AXES = Array.from({ length: 8 }, (_, idx) => {
  const angle = ((idx * 45 - 90) * Math.PI) / 180;
  return {
    x1: 180 + Math.cos(angle) * 32,
    y1: 130 + Math.sin(angle) * 32,
    x2: 180 + Math.cos(angle) * 80,
    y2: 130 + Math.sin(angle) * 80,
  };
});

export const PillarCompassDiagram = React.memo<PillarCompassDiagramProps>(({
  activePillarIndex = 0,
  className,
}) => {
  const { language } = useLanguage();
  return (
    <div
      className={cn(
        'relative flex h-[280px] w-full items-center justify-center overflow-hidden rounded-[24px] border border-[var(--border-hairline)] bg-[var(--bg-sand)] p-4',
        className
      )}
    >
      {/* Precision 2D Vector Chassis SVG */}
      <svg
        viewBox="0 0 360 260"
        className="h-full w-full max-w-[360px] text-[var(--text-primary)]"
        aria-hidden="true"
      >
        {/* Outer architectural rings */}
        <circle
          cx="180"
          cy="130"
          r="80"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="180"
          cy="130"
          r="56"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
        <circle
          cx="180"
          cy="130"
          r="32"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
        />

        {/* 8 Radial Vector Axes */}
        {COMPASS_AXES.map((axis, idx) => {
          const isHighlight = idx === activePillarIndex;

          return (
            <g key={idx}>
              <line
                x1={axis.x1}
                y1={axis.y1}
                x2={axis.x2}
                y2={axis.y2}
                stroke="currentColor"
                strokeOpacity={isHighlight ? 0.55 : 0.16}
                strokeWidth={isHighlight ? 1.75 : 1}
              />
              <circle
                cx={axis.x2}
                cy={axis.y2}
                r={isHighlight ? 4.5 : 3}
                className={
                  isHighlight
                    ? 'fill-[#121212] dark:fill-orchid'
                    : 'fill-current opacity-35'
                }
              />
            </g>
          );
        })}

        {/* Central 31D Telemetry Core */}
        <circle
          cx="180"
          cy="130"
          r="22"
          className="fill-[#121212] dark:fill-orchid"
        />
        <text
          x="180"
          y="134"
          textAnchor="middle"
          className="fill-[#E6FA72] dark:fill-[#0D0914] font-mono text-[11px] font-bold tracking-wider"
        >
          31D
        </text>
      </svg>

      {/* Frosted Glass Stadium Pill Overlays */}
      {CORE_PILLARS.map((pillar, idx) => {
        const Icon = pillar.icon;
        const slot = COMPASS_SLOTS[idx] ?? {
          style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
          isSide: false,
        };
        const isActive = idx === activePillarIndex;

        return (
          <div
            key={pillar.name}
            style={slot.style}
            className={cn(
              'glass-pill absolute inline-flex w-max items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition-colors xl:gap-1.5 xl:px-2.5 xl:text-[11px]',
              slot.isSide ? 'max-w-[46%]' : 'max-w-[85%]',
              isActive
                ? 'border-[#121212] bg-[#E6FA72]/90 text-[#121212] dark:border-orchid dark:bg-orchid/90 dark:text-[#0D0914]'
                : 'text-[var(--text-primary)]'
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="min-w-0 truncate">{translatePillarText(language, pillar.shortName)}</span>
          </div>
        );
      })}
    </div>
  );
});
