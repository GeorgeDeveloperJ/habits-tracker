import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHabits } from '../context/useHabits';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { activeCycle, progress } = useHabits();
  const navigate = useNavigate();

  const currentDay = progress?.stats?.currentDayNumber ?? (activeCycle ? 1 : 0);
  const userEmail = user?.email ?? 'member@proactive31.app';
  const initials = userEmail.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/', label: 'Command Center', icon: LayoutDashboard, end: true },
    { to: '/analytics', label: 'Analytics & Balance', icon: BarChart3, end: false },
  ];

  return (
    <div className="flex min-h-screen bg-[#090A0F] text-[#F8FAFC]">
      {/* Desktop Collapsible Left Navigation Rail */}
      <aside
        className={`hidden md:flex flex-col justify-between border-r border-[#1E2330] bg-[#12151E] transition-all duration-200 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex h-16 items-center justify-between border-b border-[#1E2330] px-4">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30">
                <Zap className="h-4 w-4" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold tracking-tight text-[#F8FAFC]">
                    Proactive<span className="text-[#8B5CF6]">31</span>
                  </p>
                  <p className="truncate text-[11px] text-[#64748B]">Habit Command</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1E2330] bg-[#171A26] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Sprint Badge */}
          <div className="px-3 pt-4">
            <div
              className={`rounded-xl border border-[#1E2330] bg-[#171A26] px-3 py-2.5 ${
                collapsed ? 'flex flex-col items-center' : ''
              }`}
            >
              {!collapsed && (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Active Sprint
                </p>
              )}
              <p className="font-mono-tabular text-sm font-bold text-[#8B5CF6] mt-0.5">
                {activeCycle
                  ? collapsed
                    ? `D${String(currentDay).padStart(2, '0')}`
                    : `Day ${String(currentDay).padStart(2, '0')} / 31`
                  : collapsed
                  ? '--'
                  : 'No Sprint'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1.5 px-3" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#7C3AED]/15 text-[#F8FAFC] border border-[#8B5CF6]/40'
                        : 'text-[#94A3B8] hover:bg-[#171A26] hover:text-[#F8FAFC] border border-transparent'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#8B5CF6]" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-[#1E2330] p-3 space-y-2.5">
          <div
            className={`flex items-center gap-2.5 rounded-xl bg-[#171A26]/70 p-2 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#F8FAFC]">{userEmail}</p>
                <p className="text-[11px] text-[#10B981]">Active Session</p>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size={collapsed ? 'icon' : 'sm'}
            onClick={handleLogout}
            className={collapsed ? 'w-full' : 'w-full justify-start text-[#94A3B8] hover:text-[#EF4444]'}
            title="Log Out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-[#1E2330] bg-[#12151E] px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">
              Proactive<span className="text-[#8B5CF6]">31</span>
            </span>
            {activeCycle && (
              <span className="ml-2 rounded-md bg-[#171A26] px-2 py-0.5 font-mono-tabular text-xs font-semibold text-[#8B5CF6]">
                Day {String(currentDay).padStart(2, '0')}/31
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg border border-[#1E2330] bg-[#171A26] p-2 text-[#94A3B8]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="border-b border-[#1E2330] bg-[#12151E] p-4 space-y-2 md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-[#7C3AED]/15 text-[#F8FAFC] border border-[#8B5CF6]/40'
                        : 'text-[#94A3B8]'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 text-[#8B5CF6]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E2330]">
              <span className="truncate text-xs text-[#94A3B8]">{userEmail}</span>
              <Button type="button" variant="danger" size="sm" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
