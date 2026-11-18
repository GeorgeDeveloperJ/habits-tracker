import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { AuthShowcasePanel, AuthThemeToggleBar } from './Login';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        email: email.trim(),
        password,
      });
      if (response.data?.success && response.data?.data?.token) {
        const { token: jwt, id, email: userEmail } = response.data.data;
        login(jwt, { id, email: userEmail });
        navigate('/', { replace: true });
      } else {
        navigate('/login');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Unable to create account. Please try again.');
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

          <div className="rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-7 sm:p-9">
            <div className="mb-7">
              <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                31-Day Sprint Onboarding
              </p>
              <h1 className="mt-2 text-4xl sm:text-[38px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
                Create{' '}
                <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#5CE68A] px-3 py-1 text-[#121212] dark:bg-[#F5B841] dark:text-[#0D0914]">
                  <Sparkles className="h-4 w-4 stroke-[2.4]" />
                </span>{' '}
                workspace
              </h1>
              <p className="mt-2.5 text-sm text-[var(--text-secondary)]">
                Build unbreakable consistency across 8 Core Pillars in 31 days.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="register-email"
                  className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  Email address
                </label>
                <Input
                  id="register-email"
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
                  htmlFor="register-password"
                  className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  Password
                </label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  Confirm password
                </label>
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-[18px] border border-[#DC2626]/30 bg-[#DC2626]/10 px-4 py-3 text-xs font-medium text-[#DC2626] dark:border-[#F87171]/35 dark:bg-[#F87171]/15 dark:text-[#F87171]"
                >
                  {error}
                </div>
              )}

              <Button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create Account &amp; Launch
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-5 text-sm">
              <span className="text-[var(--text-secondary)]">Already have an account?</span>
              <Link
                to="/login"
                className="inline-flex items-center rounded-full bg-[var(--bg-sand)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[#E6FA72] hover:text-[#121212] dark:hover:bg-[#D96BFF] dark:hover:text-[#0D0914] transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-5 font-mono-tabular text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#5CE68A]" />
              Instant JWT auto-login
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#5CE68A]" />
              Zero setup friction
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
