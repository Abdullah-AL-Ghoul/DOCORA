import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/supabase/session';

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: No active authenticated session' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: session.userId,
      email: session.email,
      displayName: session.displayName,
      planTier: session.planTier,
      role: session.role,
    },
  });
}
