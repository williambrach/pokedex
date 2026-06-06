// app/auth/callback/route.ts — completes magic-link sign-in. Handles both the
// PKCE flow (?code=) and the OTP token_hash flow, so it works regardless of
// which email-template style the Supabase project uses.
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Only allow same-origin, path-relative redirect targets — never an absolute or
// protocol-relative URL. Prevents open-redirect/phishing via ?next=.
function safeNext(raw: string | null): string {
  if (!raw) return '/';
  // Must be a single-slash absolute path; reject //host, /\host, and anything
  // that parses to a different origin (e.g. "@evil.com").
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}

const OTP_TYPES: ReadonlySet<string> = new Set(['magiclink', 'email', 'recovery', 'signup', 'invite', 'email_change']);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const rawType = searchParams.get('type');
  const next = safeNext(searchParams.get('next'));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (tokenHash && rawType && OTP_TYPES.has(rawType)) {
    const { error } = await supabase.auth.verifyOtp({ type: rawType as EmailOtpType, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
