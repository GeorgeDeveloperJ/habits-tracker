import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Lock, Sparkles, Zap } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { CORE_PILLARS } from '../../lib/pillars';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function AuthShowcasePanel() {
  const previewDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden border-r border-[#1E2330] bg-[#0B0D13] p-12">
      {/* Subtle radial atmospheric glow */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#1E2330] bg-[#12151E] px-3.5 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7C3AED] text-white">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-[#F8FAFC]">
            Proactive<span className="text-[#8B5CF6]">31</span>
          </span>
          <span className="ml-2 rounded-md bg-[#171A26] px-2 py-0.5 font-mono-tabular text-[11px] font-medium text-[#94A3B8]">
            8-PILLAR ENGINE
          </span>
        </div>

        <div className="mt-10 max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.12]">
            Plan Tonight.
            <span className="block text-[#8B5CF6] mt-1">Execute Tomorrow.</span>
          </h2>
          <p className="mt-4 text-base text-[#94A3B8] leading-relaxed">
            Passive trackers record yesterday. Proactive31 locks your commitment across 8 Core Pillars every evening before you close your day.
          </p>
        </div>

        {/* Interactive 31-day visual preview strip */}
        <div className="mt-8 rounded-2xl border border-[#1E2330] bg-[#11131C]/90 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              31-Day Sprint Cadence
            </span>
            <span className="font-mono-tabular text-xs font-semibold text-[#10B981]">
              Day 07 / 31 · 89%
            </span>
          </div>
          <div className="grid grid-cols-11 gap-1.5">
            {previewDays.map((day) => {
              const isClosed = day <= 6;
              const isToday = day === 7;
              const isTomorrow = day === 8;
              return (
                <div
                  key={day}
                  className={`flex h-7 items-center justify-center rounded-md font-mono-tabular text-[11px] font-semibold transition-all ${
                    isClosed
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                      : isToday
                      ? 'bg-[#7C3AED] text-[#F8FAFC] ring-2 ring-[#8B5CF6]/40'
                      : isTomorrow
                      ? 'border border-dashed border-[#F59E0B]/60 bg-[#F59E0B]/10 text-[#F59E0B]'
                      : 'border border-[#1E2330] bg-[#181C28] text-[#64748B]'
                  }`}
                >
                  {String(day).padStart(2, '0')}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 8 Core Pillars Overview Grid */}
      <div className="relative z-10 mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          The 8 Core Life Pillars
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {CORE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.name}
                className="flex items-center gap-2.5 rounded-xl border border-[#1E2330] bg-[#12151E]/80 px-3 py-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#171A26] text-[#8B5CF6]">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#F8FAFC]">{pillar.name}</p>
                  <p className="truncate text-[11px] text-[#64748B]">{pillar.tagline}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });
      if (response.data?.success && response.data?.data?.token) {
        const { token: jwt, id, email: userEmail } = response.data.data;
        login(jwt, { id, email: userEmail });
        navigate('/', { replace: true });
      } else {
        setError('Invalid authentication response from server.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090A0F] text-[#F8FAFC]">
      <AuthShowcasePanel />

      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Proactive<span className="text-[#8B5CF6]">31</span>
            </span>
          </div>

          <div className="rounded-2xl border border-[#1E2330] bg-[#12151E]/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#1E2330] bg-[#171A26] px-3 py-1 text-xs font-medium text-[#8B5CF6]">
                <Lock className="h-3 w-3" />
                Command Center Access
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-[#94A3B8]">
                Sign in to execute today&apos;s plan and lock tomorrow&apos;s 8 pillars.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]"
                >
                  Email address
                </label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]"
                >
                  Password
                </label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]"
                >
                  {error}
                </div>
              )}

              <Button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Enter Command Center
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-[#1E2330] pt-5 flex items-center justify-between text-sm">
              <span className="text-[#94A3B8]">New to Proactive31?</span>
              <Link
                to="/register"
                className="inline-flex items-center gap-1 font-semibold text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Start a 31-day sprint
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
              Multi-tenant isolated
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
              8 Core Life Pillars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
