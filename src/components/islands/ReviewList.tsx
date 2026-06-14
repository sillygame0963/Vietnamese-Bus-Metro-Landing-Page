import { useState, useEffect } from 'preact/hooks';
import { getSupabase } from '../../lib/supabase';
import type { Review } from '../../types/database';

interface ReviewWithProfile extends Review {
  profiles: { display_name: string; avatar_emoji: string } | null;
}

export default function ReviewList() {
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sb = getSupabase();

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchLikes(session.user.id);
      }
    });

    fetchReviews();
  }, []);

  async function fetchReviews() {
    const { data } = await getSupabase()
      .from('reviews')
      .select('*, profiles(display_name, avatar_emoji)')
      .eq('city', 'hcmc')
      .order('created_at', { ascending: false })
      .limit(10);

    setReviews(data || []);
    setLoading(false);
  }

  async function fetchLikes(uid: string) {
    const { data } = await getSupabase()
      .from('review_likes')
      .select('review_id')
      .eq('user_id', uid) as { data: { review_id: string }[] | null };

    if (data) {
      setLikedIds(new Set(data.map(l => l.review_id)));
    }
  }

  async function toggleLike(reviewId: string) {
    if (!userId) return;
    const sb = getSupabase();
    const liked = likedIds.has(reviewId);

    if (liked) {
      await sb.from('review_likes').delete().eq('user_id', userId).eq('review_id', reviewId);
      setLikedIds(prev => { const s = new Set(prev); s.delete(reviewId); return s; });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes_count: r.likes_count - 1 } : r));
    } else {
      await (sb.from('review_likes') as any).insert({ user_id: userId, review_id: reviewId });
      setLikedIds(prev => new Set(prev).add(reviewId));
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes_count: r.likes_count + 1 } : r));
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  if (loading) {
    return (
      <div class="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} class="bg-white rounded-2xl p-4 card-shadow animate-pulse">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full bg-gray-200" />
              <div class="flex-1">
                <div class="h-4 bg-gray-200 rounded w-24 mb-1" />
                <div class="h-3 bg-gray-100 rounded w-32" />
              </div>
            </div>
            <div class="h-4 bg-gray-100 rounded w-full mb-2" />
            <div class="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div class="bg-white rounded-2xl p-6 card-shadow text-center">
        <div class="text-3xl mb-2">📝</div>
        <div class="text-sm font-semibold text-text">Chưa có review nào</div>
        <div class="text-xs text-text-muted mt-1">Hãy là người đầu tiên chia sẻ!</div>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      {reviews.map(review => (
        <div key={review.id} class="bg-white rounded-2xl p-4 card-shadow">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              {review.profiles?.avatar_emoji || '👤'}
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold text-text">
                {review.profiles?.display_name || 'Ẩn danh'}
              </div>
              <div class="text-xs text-text-muted flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
                {review.station_name}
              </div>
            </div>
            <div class="flex gap-0.5">
              {Array.from({ length: review.rating }).map((_, i) => (
                <svg key={i} class="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>

          <p class="text-sm text-text leading-relaxed mb-3">{review.text}</p>

          <div class="flex items-center justify-between text-xs text-text-muted">
            <span>{timeAgo(review.created_at)}</span>
            <button
              onClick={() => toggleLike(review.id)}
              class={`flex items-center gap-1 transition-colors ${
                likedIds.has(review.id) ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              <svg class="w-4 h-4" fill={likedIds.has(review.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {review.likes_count}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
