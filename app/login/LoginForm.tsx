'use client';
// app/login/LoginForm.tsx — passwordless magic-link form.
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
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
          Sign in to sync your card collection across devices.
        </div>

        {sent ? (
          <div
            style={{
              textAlign: 'center',
              padding: '20px 14px',
              borderRadius: 14,
              background: '#f0fbf3',
              color: '#1f7a44',
              fontSize: 14.5,
              lineHeight: 1.5,
            }}
          >
            <b>Check your inbox.</b>
            <br />
            We sent a magic link to {email}. Open it on this device to finish signing in.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
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
              }}
            />
            {err && <div style={{ color: '#e23b2e', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{err}</div>}
            <button
              type="submit"
              disabled={loading}
              style={{
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
              }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11.5, color: '#aab0b8', lineHeight: 1.5 }}>
          No password needed. We&apos;ll email you a one-tap sign-in link.
        </div>
      </div>
    </div>
  );
}
