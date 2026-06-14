import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

let _supabaseAdmin: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    const url = import.meta.env.PUBLIC_SUPABASE_URL;
    const key = import.meta.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('Supabase server env vars not configured.');
    }
    _supabaseAdmin = createClient<Database>(url, key);
  }
  return _supabaseAdmin;
}
