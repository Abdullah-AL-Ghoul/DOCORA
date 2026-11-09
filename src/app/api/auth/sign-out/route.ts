import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { SESSION_COOKIE_NAME } from '@/lib/supabase/session';

export async function POST(request: NextRequest) {
  const { isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    try {
      const supabase = await createServerClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }

  const response = NextResponse.json({ ok: true, message: 'Signed out successfully' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
