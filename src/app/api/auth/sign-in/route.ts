import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createLocalSessionToken, SESSION_COOKIE_NAME } from '@/lib/supabase/session';

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = SignInSchema.parse(await request.json());
    const { isConfigured } = getSupabaseConfig();

    if (isConfigured) {
      const supabase = await createServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

      if (error || !data.user) {
        return NextResponse.json(
          { ok: false, error: error?.message || 'Authentication failed' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        ok: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        },
      });
    }

    // Local authentication fallback for self-hosted / offline testing
    const userId = `usr-${Buffer.from(body.email).toString('hex').slice(0, 16)}`;
    const token = createLocalSessionToken({
      userId,
      email: body.email,
      displayName: body.email.split('@')[0],
      planTier: 'free',
      role: 'authenticated',
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: body.email,
        displayName: body.email.split('@')[0],
        planTier: 'free',
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid sign in request';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
