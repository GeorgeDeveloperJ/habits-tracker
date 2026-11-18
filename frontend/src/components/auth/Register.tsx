import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Zap } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { AuthShowcasePanel } from './Login';
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
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#1E2330] bg-[#171A26] px-3 py-1 text-xs font-medium text-[#10B981]">
                <Sparkles className="h-3 w-3" />
                31-Day Sprint Onboarding
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Create your workspace
              </h1>
              <p className="mt-1.5 text-sm text-[#94A3B8]">
                Build unbreakable consistency across 8 Core Pillars in 31 days.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="register-email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]"
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
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]"
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
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]"
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
                  className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]"
                >
                  {error}
                </div>
              )}

              <Button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create Account & Launch
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-[#1E2330] pt-5 flex items-center justify-between text-sm">
              <span className="text-[#94A3B8]">Already have an account?</span>
              <Link
                to="/login"
                className="font-semibold text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
              Instant JWT auto-login
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
              Zero setup friction
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
