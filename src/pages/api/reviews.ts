import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase-server';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const city = url.searchParams.get('city') || 'hcmc';
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { data, error } = await getSupabaseAdmin()
    .from('reviews')
    .select('*, profiles(display_name, avatar_emoji)')
    .eq('city', city)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data));
};
