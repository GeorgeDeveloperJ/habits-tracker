import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Search, Globe, Sun, ShoppingCart, Bell, LayoutDashboard, Grid, 
  Settings, User, LogOut, Target, CheckCircle2
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

export default function AppLayout() {
  const location = useLocation();

  const isDashboardActive = location.pathname === '/';
  const isTrackerActive = location.pathname === '/tracker';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-rose-900 to-rose-950 flex flex-col border-r border-rose-800/50">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HabitFlow</span>
        </div>

        <div className="px-6 mb-6">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <Avatar className="h-10 w-10 border-2 border-rose-400">
              <AvatarImage src="https://i.pravatar.cc/150?u=george" />
              <AvatarFallback>GS</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-white">George Santana</p>
              <p className="text-xs text-rose-300">Pro Member</p>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-300" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-rose-300/50 focus-visible:ring-rose-500"
            />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="mb-4">
            <p className="px-2 text-xs font-semibold text-rose-300/70 uppercase tracking-wider mb-2">Dashboard</p>
            <Link 
              to="/" 
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors font-medium",
                isDashboardActive ? "bg-white/10 text-white" : "text-rose-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              Analytics
            </Link>
            <Link 
              to="/tracker" 
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors font-medium mt-1",
                isTrackerActive ? "bg-white/10 text-white" : "text-rose-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <CheckCircle2 className="h-5 w-5" />
              Habit Tracker
            </Link>
          </div>
          
          <div className="mb-4">
            <p className="px-2 text-xs font-semibold text-rose-300/70 uppercase tracking-wider mb-2">Apps</p>
            <a href="#" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-rose-200 hover:bg-white/5 hover:text-white transition-colors">
              <Grid className="h-5 w-5" />
              Integrations
            </a>
            <a href="#" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-rose-200 hover:bg-white/5 hover:text-white transition-colors">
              <Settings className="h-5 w-5" />
              Settings
            </a>
          </div>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <a href="#" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-rose-200 hover:bg-white/5 hover:text-white transition-colors">
            <LogOut className="h-5 w-5" />
            Log Out
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md z-10 sticky top-0">
          <div className="flex-1 max-w-md">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search everywhere..." 
                className="pl-9 bg-slate-900 border-slate-800 rounded-full focus-visible:ring-slate-700"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
              <Globe className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
              <Sun className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
            </Button>
            <div className="h-8 w-px bg-slate-800 mx-1"></div>
            <Avatar className="h-8 w-8 cursor-pointer border border-slate-700">
              <AvatarImage src="https://i.pravatar.cc/150?u=george" />
              <AvatarFallback>GS</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT via OUTLET */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
