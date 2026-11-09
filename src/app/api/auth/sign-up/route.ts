import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createLocalSessionToken, SESSION_COOKIE_NAME } from '@/lib/supabase/session';

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = SignUpSchema.parse(await request.json());
    const { isConfigured } = getSupabaseConfig();
    const displayName = body.displayName || body.email.split('@')[0];

    if (isConfigured) {
      const supabase = await createServerClient();
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: {
            full_name: displayName,
            plan_tier: 'free',
          },
        },
      });

      if (error || !data.user) {
        return NextResponse.json(
          { ok: false, error: error?.message || 'Registration failed' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName,
        },
      });
    }

    // Local authentication fallback
    const userId = `usr-${Buffer.from(body.email).toString('hex').slice(0, 16)}`;
    const token = createLocalSessionToken({
      userId,
      email: body.email,
      displayName,
      planTier: 'free',
      role: 'authenticated',
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: body.email,
        displayName,
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
    const message = error instanceof Error ? error.message : 'Invalid sign up request';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
