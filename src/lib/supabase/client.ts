import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

/**
 * Creates a browser-side Supabase client instance.
 * Safe for use in Client Components ('use client').
 */
export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    // Return a dummy/mock client interface when Supabase is not configured to avoid runtime crash in dev/tests
    return createBrowserClient(
      'https://placeholder-project.supabase.co',
      'placeholder-anon-key'
    );
  }

  return createBrowserClient(url, anonKey);
}
