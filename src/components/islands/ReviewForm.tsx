import { useState, useEffect } from 'preact/hooks';
import { getSupabase } from '../../lib/supabase';

const STATIONS = [
  { name: 'Ga Bến Thành', type: 'metro' as const },
  { name: 'Ga Nhà hát TP', type: 'metro' as const },
  { name: 'Ga Ba Son', type: 'metro' as const },
  { name: 'Ga Văn Thánh', type: 'metro' as const },
  { name: 'Ga Tân Cảng', type: 'metro' as const },
  { name: 'Ga Thảo Điền', type: 'metro' as const },
  { name: 'Ga An Phú', type: 'metro' as const },
  { name: 'Ga Rạch Chiếc', type: 'metro' as const },
  { name: 'Ga Phước Long', type: 'metro' as const },
  { name: 'Ga Bình Thái', type: 'metro' as const },
  { name: 'Ga Thủ Đức', type: 'metro' as const },
  { name: 'Ga Công nghệ cao', type: 'metro' as const },
  { name: 'Ga Đại học QG', type: 'metro' as const },
  { name: 'Ga Suối Tiên', type: 'metro' as const },
  { name: 'Trạm Buýt Bến Thành', type: 'bus' as const },
  { name: 'Trạm Buýt Chợ Lớn', type: 'bus' as const },
  { name: 'Trạm Buýt Sài Gòn', type: 'bus' as const },
];

interface Props {
  onReviewAdded?: () => void;
}

export default function ReviewForm({ onReviewAdded }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [station, setStation] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!userId || !station || !text.trim()) return;

    setSubmitting(true);
    setError('');

    const selectedStation = STATIONS.find(s => s.name === station);

    const { error: insertError } = await (getSupabase()
      .from('reviews') as any)
      .insert({
        user_id: userId,
        station_name: station,
        station_type: selectedStation?.type || 'bus',
        city: 'hcmc' as const,
        rating,
        text: text.trim(),
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      setText('');
      setStation('');
      setRating(5);
      onReviewAdded?.();
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  if (!userId) {
    return (
      <div class="bg-white rounded-2xl p-4 card-shadow text-center">
        <div class="text-sm text-text-muted">
          Đăng nhập để viết review ✍️
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="bg-white rounded-2xl p-4 card-shadow">
      <div class="text-sm font-semibold text-text mb-3">Viết review</div>

      {/* Station Select */}
      <select
        value={station}
        onChange={(e) => setStation((e.target as HTMLSelectElement).value)}
        required
        class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
      >
        <option value="">Chọn trạm / ga...</option>
        <optgroup label="🚇 Metro">
          {STATIONS.filter(s => s.type === 'metro').map(s => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </optgroup>
        <optgroup label="🚌 Xe buýt">
          {STATIONS.filter(s => s.type === 'bus').map(s => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </optgroup>
      </select>

      {/* Rating */}
      <div class="flex items-center gap-1 mb-3">
        <span class="text-xs text-text-muted mr-2">Đánh giá:</span>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            class="focus:outline-none"
          >
            <svg
              class={`w-5 h-5 ${star <= rating ? 'text-accent' : 'text-gray-200'} transition-colors`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      {/* Text */}
      <textarea
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        placeholder="Chia sẻ trải nghiệm của bạn..."
        required
        rows={3}
        class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
      />

      {error && <div class="text-xs text-red-500 mb-2">{error}</div>}

      {success ? (
        <div class="text-sm text-secondary font-semibold text-center py-2">
          ✅ Đã đăng review!
        </div>
      ) : (
        <button
          type="submit"
          disabled={submitting}
          class="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Đang gửi...' : 'Đăng review'}
        </button>
      )}
    </form>
  );
}
