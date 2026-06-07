'use client';
// app/login/LoginForm.tsx — passwordless sign-in via a 6-digit email code.
// Two steps: (1) enter email -> Supabase mails a one-time code, (2) type the
// code -> verifyOtp establishes the session. Code entry happens in the same
// browser, so it works reliably on mobile (no cross-browser / in-app-browser
// PKCE problem that magic-link clicks suffer from).
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 48,
  padding: '0 16px',
  borderRadius: 13,
  border: '1px solid #e2e5ea',
  background: '#f7f8fa',
  fontSize: 16,
  outline: 'none',
  marginBottom: 12,
};

const buttonStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%',
  height: 48,
  borderRadius: 13,
  border: 0,
  background: '#e23b2e',
  color: '#fff',
  fontWeight: 700,
  fontSize: 15.5,
  cursor: loading ? 'default' : 'pointer',
  opacity: loading ? 0.7 : 1,
});

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    // emailRedirectTo keeps the magic-link fallback working too; the email
    // template decides whether it shows the link, the {{ .Token }} code, or both.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setStep('code');
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    });
    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }
    // Session cookies are set — hard-navigate so the server re-reads them and
    // middleware lets us through to the collection.
    window.location.assign('/');
  }

  function backToEmail() {
    setStep('email');
    setCode('');
    setErr(null);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 1px 2px rgba(20,30,50,.05), 0 20px 50px rgba(20,30,50,.14)',
        }}
      >
        {/* poké-mark */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            margin: '0 auto 16px',
            background: 'linear-gradient(#e23b2e 0 50%, #fff 50% 100%)',
            border: '4px solid #13151a',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 'calc(50% - 2.5px)', left: 0, right: 0, height: 5, background: '#13151a' }} />
          <div
            style={{
              position: 'absolute',
              top: 'calc(50% - 8px)',
              left: 'calc(50% - 8px)',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#fff',
              border: '4px solid #13151a',
            }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 4, fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>Pokédex</div>
        <div style={{ textAlign: 'center', marginBottom: 22, fontSize: 14, color: '#8b9099' }}>
          {step === 'email'
            ? 'Sign in to sync your card collection across devices.'
            : `Enter the code we emailed to ${email}.`}
        </div>

        {step === 'email' ? (
          <form onSubmit={sendCode}>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
            {err && <div style={{ color: '#e23b2e', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{err}</div>}
            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="12345678"
              style={{ ...inputStyle, textAlign: 'center', letterSpacing: 6, fontSize: 22, fontWeight: 700 }}
            />
            {err && <div style={{ color: '#e23b2e', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{err}</div>}
            <button type="submit" disabled={loading || code.length < 6} style={buttonStyle(loading || code.length < 6)}>
              {loading ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={backToEmail}
              style={{
                width: '100%',
                marginTop: 10,
                background: 'none',
                border: 0,
                color: '#8b9099',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ← Use a different email
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11.5, color: '#aab0b8', lineHeight: 1.5 }}>
          No password needed. We&apos;ll email you a one-time sign-in code.
        </div>
      </div>
    </div>
  );
}
