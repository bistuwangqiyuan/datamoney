import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // During build time without env vars, return a placeholder
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that won't be used during build
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

