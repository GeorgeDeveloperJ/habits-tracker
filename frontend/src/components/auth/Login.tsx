import { translateFeedback } from '../../i18n/messages';
import LanguageToggle from '../LanguageToggle';
import { useLanguage } from '../../i18n/useLanguage';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { HorizonGlyph, KrakenHabitsMark } from '../icons/BrandMark';
import { signIn, type VerificationChallenge } from '../../services/api';
import { EmailVerificationForm } from './EmailVerificationForm';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import {
  DotMatrixRibbon,
  PillarCompassDiagram,
  SegmentedBattery,
} from '../charts/HardwareViz';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function AuthShowcasePanel() {
  const { t } = useLanguage();
  const previewDays = Array.from({ length: 31 }, (_, i) => {
    const dayNumber = i + 1;
    return {
      dayNumber,
      isClosed: dayNumber <= 6,
      isToday: dayNumber === 7,
      isTomorrow: dayNumber === 8,
      isLogged: dayNumber <= 7,
    };
  });

  return (
    <div className="hidden lg:flex lg:w-[52%] flex-col gap-4 p-4 pr-2">
      {/* Top Bento Manifesto Card */}
      <div className="flex flex-col justify-between rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-3.5 py-1.5 dark:bg-[#1E1730]">
            <KrakenHabitsMark className="h-6 w-6 shrink-0" />
            <span className="text-xs font-bold tracking-tight">Kraken Habits</span>
          </div>
          <span className="rounded-full bg-[#E6FA72] px-3 py-1 font-mono-tabular text-[10px] font-bold uppercase tracking-[0.14em] text-[#121212] dark:bg-orchid/20 dark:text-orchid">
            {t("8-Pillar Telemetry")}
          </span>
        </div>

        <div className="mt-8">
          <h2 className="text-[42px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
            {t("Plan")}{' '}
            <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#E6FA72] px-3.5 py-1 text-[#121212] dark:bg-orchid dark:text-[#0D0914]">
              <HorizonGlyph className="h-5 w-5" />
            </span>{' '}
            {t("Tonight.")}
            <span className="block text-[var(--text-secondary)]">{t("Execute Tomorrow.")}</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
            {t("Passive trackers log yesterday. Kraken Habits locks your commitment across 8 Core Life Pillars every evening before you close your day.")}
          </p>
        </div>
      </div>

      {/* Bottom Asymmetrical Bento Visual Anchors */}
      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
        {/* 2D Vector Compass + Frosted Glass Pill Overlays */}
        <div className="min-w-0 xl:col-span-7 flex flex-col justify-between rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t("8-Pillar Vector Matrix")}
            </span>
            <span className="shrink-0 whitespace-nowrap font-mono-tabular text-[11px] font-semibold text-[var(--text-primary)]">
              {t("360° Balance")}
            </span>
          </div>
          <PillarCompassDiagram activePillarIndex={0} className="flex-1 min-h-[260px]" />
        </div>

        {/* High-Contrast Hardware Telemetry Preview Block */}
        <div className="min-w-0 xl:col-span-5 flex flex-col justify-between rounded-[28px] bg-[#121212] p-6 text-[#F4F4F2] dark:border dark:border-white/[0.06] dark:bg-[#171224] dark:text-[#F7F5FF]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                {t("Sprint Cadence")}
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-complete px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[#121212]">
                {t("DAY 07/31")}
              </span>
            </div>

            <div className="mt-5">
              <p className="font-mono-tabular text-[40px] font-semibold leading-none tracking-[-0.04em]">
                89%
              </p>
              <p className="mt-1.5 text-xs text-white/60">
                {t("Average closed-day adherence")}
              </p>
            </div>

            <div className="mt-5">
              <SegmentedBattery
                total={8}
                filled={8}
                label={t("Gatekeeper Lock")}
                size="md"
                variant="contrast"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-2 font-mono-tabular text-[10px] uppercase tracking-[0.14em] text-white/50">
              {t("31-Day Capsule Strip")}
            </p>
            <DotMatrixRibbon days={previewDays} interactive={false} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthThemeToggleBar() {
  const { t } = useLanguage();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <div className="mb-6 flex items-center justify-between gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-recessed)] px-2.5 py-2 sm:gap-3 sm:px-3.5">
      <div className="flex min-w-0 items-center gap-2">
        <KrakenHabitsMark className="h-7 w-7 shrink-0" />
        <span className="min-w-0 truncate text-xs font-bold tracking-tight">Kraken Habits</span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <LanguageToggle />
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          aria-label={t(theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 py-1 sm:px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-3.5 w-3.5 shrink-0 text-amber" />
              <span className="hidden min-[360px]:inline">{t("Light")}</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden min-[360px]:inline">{t("Dark")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

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
      const result = await signIn({ email: email.trim(), password, language });
      if (result.code === 'verification_required') {
        setChallenge(result.data);
        setPassword('');
      } else if (result.data?.token) {
        const { token: jwt, id, email: userEmail } = result.data;
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
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <AuthShowcasePanel />

      <div className="flex w-full lg:w-[48%] flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <AuthThemeToggleBar />

          <div className="rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-5 sm:p-8">
            {challenge ? (
              <EmailVerificationForm challenge={challenge} onBack={() => setChallenge(null)} />
            ) : (
              <>
                <div className="mb-7">
                  <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {t("Command Center Access")}
                  </p>
                  <h1 className="mt-2 text-4xl sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
                    {t("Welcome")}{' '}
                    <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#E6FA72] px-3 py-1 text-[#121212] dark:bg-orchid dark:text-[#0D0914]">
                      <Lock className="h-4 w-4 stroke-[2.4]" />
                    </span>{' '}
                    {t("back")}
                  </h1>
                  <p className="mt-2.5 text-sm text-[var(--text-secondary)]">
                    {t("Sign in to execute today's plan and lock tomorrow's 8 pillars.")}
                  </p>
                </div>

                {resetSuccess && (
                  <div
                    role="status"
                    className="mb-5 flex items-center gap-2.5 rounded-[20px] border border-complete/50 bg-complete/20 px-4 py-3 text-xs font-semibold text-[#121212] dark:text-complete"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{t("Password updated successfully. You can now sign in.")}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label
                      htmlFor="login-email"
                      className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                    >
                      {t("Email address")}
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
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label
                        htmlFor="login-password"
                        className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                      >
                        {t("Password")}
                      </label>
                      <Link
                        id="forgot-password-link"
                        to="/forgot-password"
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-4 hover:bg-[var(--bg-sand)] dark:text-amber transition-colors"
                      >
                        <KeyRound className="h-3 w-3" />
                        {t("Forgot password?")}
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("Enter your password")}
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-[18px] border border-[#DC2626]/30 bg-[#DC2626]/10 px-4 py-3 text-xs font-medium text-[#DC2626] dark:border-[#F87171]/35 dark:bg-[#F87171]/15 dark:text-[#F87171]"
                    >
                      {translateFeedback(language, error)}
                    </div>
                  )}

                  <Button
                    id="login-submit-btn"
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full dark:bg-[#E8E2D8] dark:hover:bg-[#F3EEE6]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("Signing in...")}
                      </>
                    ) : (
                      <>
                        {t("Enter Command Center")}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-5 text-sm">
                  <span className="text-[var(--text-secondary)]">{t("New to Kraken Habits?")}</span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-sand)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[#E6FA72] hover:text-[#121212] dark:hover:bg-orchid dark:hover:text-[#0D0914] transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("Start a 31-day sprint")}
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono-tabular text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-complete" />
              {t("Multi-tenant isolated")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-complete" />
              {t("8 Core Pillars")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
