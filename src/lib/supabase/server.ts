import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

/**
 * Creates a server-side Supabase client for Server Components, Route Handlers & Server Actions.
 */
export async function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  if (!isConfigured) {
    return createServerClient(
      'https://placeholder-project.supabase.co',
      'placeholder-anon-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignored when invoked in Server Components where cookies are read-only
            }
          },
        },
      }
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored when invoked in Server Components where cookies are read-only
        }
      },
    },
  });
}

/**
 * Creates an admin Supabase client using the service role key.
 * Strictly for background workers and system-level operations. Never expose to client.
 */
export function createAdminClient() {
  const { url, serviceRoleKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured || !serviceRoleKey) {
    return createServerClient(
      'https://placeholder-project.supabase.co',
      'placeholder-service-key',
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );
  }

  return createServerClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
