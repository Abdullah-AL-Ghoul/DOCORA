import { NextRequest, NextResponse } from 'next/server';
import { createLocalSessionToken, SESSION_COOKIE_NAME } from '@/lib/supabase/session';

export async function POST(request: NextRequest) {
  try {
    const token = createLocalSessionToken({
      userId: 'usr-docora-guest-01',
      email: 'guest@docora.studio',
      displayName: 'ضيف التجربة المؤسسية (Sandbox Guest)',
      planTier: 'free',
      role: 'authenticated',
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: 'usr-docora-guest-01',
        email: 'guest@docora.studio',
        displayName: 'ضيف التجربة المؤسسية (Sandbox Guest)',
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
    return NextResponse.json(
      { ok: false, error: 'Failed to create guest sandbox session' },
      { status: 500 }
    );
  }
}
