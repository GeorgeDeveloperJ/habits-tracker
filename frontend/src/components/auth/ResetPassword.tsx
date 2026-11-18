import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { resetPassword } from '../../services/api';
import { AuthShowcasePanel, AuthThemeToggleBar } from './Login';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const paramToken = searchParams.get('token') ?? '';

  const [manualToken, setManualToken] = useState<string | null>(null);
  const resetToken = manualToken ?? paramToken;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authToken = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (authToken) {
      navigate('/', { replace: true });
    }
  }, [authToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetToken.trim()) {
      setError('A valid password reset token is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        token: resetToken.trim(),
        password,
      });
      navigate('/login?reset=success', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid or expired password reset token.');
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
                Set New Password
              </p>
              <h1 className="mt-2 text-3xl sm:text-[38px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
                Reset{' '}
                <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#5CE68A] px-3 py-1 text-[#121212] dark:bg-[#D96BFF] dark:text-[#0D0914]">
                  <ShieldCheck className="h-4 w-4 stroke-[2.4]" />
                </span>{' '}
                password
              </h1>
              <p className="mt-2.5 text-sm text-[var(--text-secondary)]">
                Paste your single-use reset token and choose a new password (minimum 6 characters).
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="reset-token"
                  className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  Reset token
                </label>
                <Input
                  id="reset-token"
                  name="token"
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste your 64-character reset token"
                  className="font-mono-tabular text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="reset-password"
                  className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  New password
                </label>
                <Input
                  id="reset-password"
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
                  htmlFor="reset-confirm-password"
                  className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  Confirm new password
                </label>
                <Input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
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
                id="reset-submit-btn"
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Update Password &amp; Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-5 text-sm">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
              <Link
                to="/forgot-password"
                className="inline-flex items-center rounded-full bg-[var(--bg-sand)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[#E6FA72] hover:text-[#121212] dark:hover:bg-[#D96BFF] dark:hover:text-[#0D0914] transition-colors"
              >
                Request new token
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
