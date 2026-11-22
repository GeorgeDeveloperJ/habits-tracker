import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { translateFeedback } from '../../i18n/messages';
import { useLanguage } from '../../i18n/useLanguage';
import { resendEmailVerification, verifyEmail, type VerificationChallenge } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function EmailVerificationForm({ challenge, onBack }: {
  challenge: VerificationChallenge;
  onBack: () => void;
}) {
  const { language, t } = useLanguage();
  const login = useAuthStore((state) => state.login);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<'verify' | 'resend' | null>(null);
  const [deliveryFailed, setDeliveryFailed] = useState(challenge.deliveryFailed);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setResent(false);
    setPending('verify');
    try {
      const { token, id, email } = await verifyEmail(challenge.challengeId, code);
      login(token, { id, email });
    } catch (error) {
      setError((error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? 'Unable to verify email. Please try again.');
    } finally {
      setPending(null);
    }
  };

  const resend = async () => {
    if (pending) return;
    setPending('resend');
    setError(null);
    setResent(false);
    try {
      const next = await resendEmailVerification(challenge.challengeId, language);
      setCode('');
      setDeliveryFailed(next.deliveryFailed);
      setResent(!next.deliveryFailed);
    } catch (error) {
      setError((error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? 'Unable to resend verification code. Please try again.');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[34px] font-semibold tracking-tight">{t('Check your email')}</h1>
        <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">
          {t('Enter the six-digit code for {0}.', challenge.email)}
        </p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="verification-code">{t('Verification code')}</label>
          <Input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            className="font-mono-tabular text-lg tracking-[0.2em]"
            required
            pattern="[0-9]{6}"
          />
        </div>
        {(error || deliveryFailed) && (
          <p role="alert" className="rounded-[18px] bg-[#DC2626]/10 px-4 py-3 text-sm text-[#B91C1C] dark:text-[#F87171]">
            {translateFeedback(language, error ?? 'We could not send the code. Try resending in a minute.')}
          </p>
        )}
        {resent && <p role="status" className="text-sm text-[var(--text-secondary)]">{t('A new code was sent.')}</p>}
        <Button size="lg" className="w-full" type="submit" disabled={!!pending || code.length !== 6 || deliveryFailed}>
          {pending === 'verify' && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('Verify email')}
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-4">
        <Button type="button" variant="ghost" disabled={!!pending} onClick={onBack}>{t('Change email address')}</Button>
        <Button type="button" variant="secondary" disabled={!!pending} onClick={resend}>
          {pending === 'resend' && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('Resend code')}
        </Button>
      </div>
    </div>
  );
}
