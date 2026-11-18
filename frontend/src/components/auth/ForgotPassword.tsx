import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { requestPasswordReset, type ForgotPasswordResult } from '../../services/api';
import { AuthShowcasePanel, AuthThemeToggleBar } from './Login';
import { Input } from '../ui/input';
import { Button, ButtonLink } from '../ui/button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your account email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(trimmed);
      setResult(res);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Unable to process password reset request. Please check your email address.');
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
                Credential Recovery
              </p>
              <h1 className="mt-2 text-3xl sm:text-[38px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
                Recover{' '}
                <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#E6FA72] px-3 py-1 text-[#121212] dark:bg-[#F5B841] dark:text-[#0D0914]">
                  <KeyRound className="h-4 w-4 stroke-[2.4]" />
                </span>{' '}
                access
              </h1>
              <p className="mt-2.5 text-sm text-[var(--text-secondary)]">
                Enter your registered email address to generate a secure, single-use reset token.
              </p>
            </div>

            {submitted ? (
              <div className="space-y-4">
                <div
                  role="status"
                  className="rounded-[22px] border border-[#5CE68A]/45 bg-[#5CE68A]/15 p-4 text-sm text-[var(--text-primary)]"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#121212] dark:text-[#5CE68A]" />
                    <div>
                      <p className="font-semibold">Reset instructions generated</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {result?.message ||
                          'If an account with that email exists, password reset instructions have been generated.'}
                      </p>
                    </div>
                  </div>
                </div>

                {result?.resetToken && (
                  <div className="rounded-[24px] border border-[var(--border-hairline)] bg-[var(--bg-sand)] p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        Local / Demo Reset Token
                      </span>
                      <span className="rounded-full bg-[#E6FA72] px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[#121212] dark:bg-[#D96BFF] dark:text-[#0D0914]">
                        15M TTL
                      </span>
                    </div>

                    <code className="block w-full overflow-x-auto whitespace-nowrap rounded-full bg-[var(--bg-card)] px-4 py-2 font-mono-tabular text-[11px] text-[var(--text-primary)] select-all">
                      {result.resetToken}
                    </code>

                    <ButtonLink
                      to={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
                      variant="lime"
                      size="lg"
                      className="w-full"
                    >
                      Continue to Reset Password
                      <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <ButtonLink
                    to="/reset-password"
                    variant="outline"
                    className="w-full"
                  >
                    Enter reset token manually
                  </ButtonLink>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setResult(null);
                    }}
                    className="text-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1.5 cursor-pointer"
                  >
                    Try a different email address
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-1.5 block font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                  >
                    Account email address
                  </label>
                  <div className="relative">
                    <Input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10"
                    />
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  </div>
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
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating reset token...
                    </>
                  ) : (
                    <>
                      Request Reset Link
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-5 text-sm">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
              <Link
                to="/reset-password"
                className="inline-flex items-center rounded-full bg-[var(--bg-sand)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[#E6FA72] hover:text-[#121212] dark:hover:bg-[#D96BFF] dark:hover:text-[#0D0914] transition-colors"
              >
                Have a token?
              </Link>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-5 font-mono-tabular text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#5CE68A]" />
              SHA-256 single-use tokens
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
