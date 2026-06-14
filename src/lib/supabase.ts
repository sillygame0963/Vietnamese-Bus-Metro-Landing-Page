import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

let _supabase: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    const url = import.meta.env.PUBLIC_SUPABASE_URL;
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase env vars not configured. Copy .env.example to .env and fill in values.');
    }
    _supabase = createClient<Database>(url, key);
  }
  return _supabase;
}

// Re-export for convenience — only call from client-side code
export { getSupabase as supabase };
