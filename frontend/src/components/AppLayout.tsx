import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../i18n/useLanguage';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { Proactive31Mark } from './icons/BrandMark';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useHabits } from '../context/useHabits';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { SegmentedBattery } from './charts/HardwareViz';

export default function AppLayout() {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { activeCycle, progress, categories } = useHabits();
  const navigate = useNavigate();

  const currentDay = progress?.stats?.currentDayNumber ?? (activeCycle ? 1 : 0);
  const tomorrowPlannedCount = progress?.stats?.tomorrowPlannedCount ?? 0;
  const totalPillars = categories.length || 8;
  const userEmail = user?.email ?? 'member@proactive31.app';
  const initials = userEmail.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/', label: t("Command Center"), icon: LayoutDashboard, end: true },
    { to: '/analytics', label: t("Analytics & Telemetry"), icon: BarChart3, end: false },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop High-Contrast Floating Vertical Pill Dock */}
      <aside className="hidden md:flex shrink-0 p-3 pr-0">
        <div
          className={`sticky top-3 flex h-[calc(100vh-24px)] flex-col justify-between rounded-[28px] bg-[#121212] text-[#F4F4F2] dark:border dark:border-white/[0.06] dark:bg-[#171224] dark:text-[#F7F5FF] transition-all duration-200 ${
            collapsed ? 'w-[80px] p-3' : 'w-[248px] p-4'
          }`}
        >
          <div>
            {/* Brand Lockup + Collapse Pill */}
            <div
              className={`flex items-center ${
                collapsed ? 'flex-col gap-3' : 'justify-between gap-2'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6FA72] text-[#121212] dark:bg-orchid dark:text-[#0D0914]">
                  <Proactive31Mark className="h-6 w-6" />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight">
                      Proactive<span className="text-[#E6FA72] dark:text-orchid">31</span>
                    </p>
                    <p className="font-mono-tabular truncate text-[10px] uppercase tracking-[0.14em] text-white/50">
                      {t("8-Pillar Engine")}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/75 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Sprint Telemetry Block */}
            <div
              className={`mt-5 rounded-[22px] border border-white/10 bg-white/[0.05] ${
                collapsed ? 'flex flex-col items-center px-2 py-3' : 'p-3.5'
              }`}
            >
              {!collapsed ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                      {t("Active Sprint")}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-complete" />
                  </div>
                  <p className="mt-1 font-mono-tabular text-lg font-bold tracking-tight">
                    {activeCycle
                      ? t("Day {0} / 31", String(currentDay).padStart(2, '0'))
                      : t("Ready to Launch")}
                  </p>
                  {activeCycle && (
                    <div className="mt-3">
                      <SegmentedBattery
                        total={totalPillars}
                        filled={tomorrowPlannedCount}
                        label={t("Next Lock")}
                        size="sm"
                        variant="contrast"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="h-2 w-2 rounded-full bg-complete" />
                  <span className="font-mono-tabular text-xs font-bold text-[#E6FA72] dark:text-orchid">
                    {activeCycle ? `D${String(currentDay).padStart(2, '0')}` : '--'}
                  </span>
                </div>
              )}
            </div>

            {/* Solid Stadium-Pill Navigation */}
            <nav className="mt-5 space-y-1.5" aria-label={t("Main navigation")}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#E6FA72] text-[#121212] dark:bg-orchid dark:text-[#0D0914]'
                          : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                      } ${collapsed ? 'justify-center px-0 h-11 w-11 mx-auto' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User Session & Logout */}
          <div className="space-y-2.5 border-t border-white/10 pt-3.5">
            <div
              className={`flex items-center gap-2.5 rounded-full bg-white/[0.06] ${
                collapsed ? 'justify-center p-1.5' : 'px-2.5 py-2'
              }`}
            >
              <Avatar className="h-8 w-8 border-white/15">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{userEmail}</p>
                  <p className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-complete">
                    {t("Session Live")}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title={t("Log Out")}
              className={`flex items-center gap-2 rounded-full border border-white/15 bg-transparent text-xs font-semibold text-white/75 hover:border-[#F87171]/50 hover:bg-[#F87171]/15 hover:text-[#F87171] transition-colors cursor-pointer ${
                collapsed ? 'h-10 w-10 mx-auto justify-center' : 'w-full px-4 py-2.5'
              }`}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>{t("Log Out")}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Recessed Top Pill Bar (Desktop + Mobile) */}
        <header className="px-3 pt-3 sm:px-6 sm:pt-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 rounded-full sm:gap-3 border border-[var(--border-hairline)] bg-[var(--bg-recessed)] px-3 py-2 sm:px-4">
            {/* Left: Mobile Brand + Live Day Pill */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 md:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121212] text-[#E6FA72] dark:bg-orchid dark:text-[#0D0914]">
                  <Proactive31Mark className="h-5 w-5" />
                </div>
                <span className="hidden min-[400px]:inline text-sm font-bold tracking-tight">Proactive31</span>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1 font-mono-tabular text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border-hairline)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-complete" />
                  {activeCycle
                    ? t("SPRINT DAY {0} / 31", String(currentDay).padStart(2, '0'))
                    : t("SPRINT LAUNCHPAD")}
                </span>
                {activeCycle && (
                  <span className="hidden lg:inline-flex items-center rounded-full bg-[var(--bg-card)] px-3 py-1 font-mono-tabular text-[11px] font-medium text-[var(--text-secondary)] border border-[var(--border-hairline)]">
                    {t("TOMORROW:")} {tomorrowPlannedCount}/{totalPillars} {t("PILLARS")}
                  </span>
                )}
              </div>

              {activeCycle && (
                <span className="inline-flex md:hidden items-center rounded-full bg-[var(--bg-card)] px-2.5 py-1 font-mono-tabular text-[11px] font-semibold border border-[var(--border-hairline)]">
                  D{String(currentDay).padStart(2, '0')}/31
                </span>
              )}
            </div>

            {/* Right: Theme Toggle Pill + Mobile Menu Toggle */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <LanguageToggle />
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={toggleTheme}
                aria-label={t(theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber" />
                    <span className="hidden sm:inline">{t("Light Stone")}</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-[#121212]" />
                    <span className="hidden sm:inline">{t("Obsidian Dark")}</span>
                  </>
                )}
              </button>

              <span className="hidden md:inline-flex items-center rounded-full bg-[var(--bg-card)] border border-[var(--border-hairline)] px-3 py-1.5 font-mono-tabular text-[11px] text-[var(--text-secondary)] max-w-[190px] truncate">
                {userEmail}
              </span>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-primary)] md:hidden cursor-pointer"
                aria-label={t("Toggle mobile menu")}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Recessed Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-2 rounded-[24px] border border-[var(--border-hairline)] bg-[#121212] p-4 text-[#F4F4F2] dark:bg-[#171224] dark:text-[#F7F5FF] space-y-2 md:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold ${
                        isActive
                          ? 'bg-[#E6FA72] text-[#121212] dark:bg-orchid dark:text-[#0D0914]'
                          : 'text-white/75 hover:bg-white/10'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="truncate text-xs text-white/70">{userEmail}</span>
                <Button type="button" variant="danger" size="sm" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                  {t("Log Out")}
                </Button>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
