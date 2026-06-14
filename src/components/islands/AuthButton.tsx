import { useState, useEffect } from 'preact/hooks';
import { getSupabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';

export default function AuthButton() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setUser(data);
    setLoading(false);
  }

  async function handleMagicLink(e: Event) {
    e.preventDefault();
    setError('');
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handleLogout() {
    await getSupabase().auth.signOut();
    setShowMenu(false);
  }

  if (loading) {
    return <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!user) {
    return (
      <div class="relative">
        <button
          onClick={() => setShowLogin(!showLogin)}
          class="text-sm font-semibold text-white bg-primary px-3 py-1.5 rounded-full hover:bg-primary-dark transition-colors"
        >
          Đăng nhập
        </button>

        {showLogin && (
          <div class="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-72 z-50">
            {sent ? (
              <div class="text-center py-2">
                <div class="text-2xl mb-2">✉️</div>
                <div class="text-sm font-semibold text-text">Kiểm tra email!</div>
                <div class="text-xs text-text-muted mt-1">Link đăng nhập đã gửi tới {email}</div>
                <button
                  onClick={() => { setSent(false); setShowLogin(false); }}
                  class="mt-3 text-xs text-primary hover:underline"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink}>
                <div class="text-sm font-semibold text-text mb-2">Đăng nhập bằng email</div>
                <input
                  type="email"
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                  placeholder="email@example.com"
                  required
                  class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {error && <div class="text-xs text-red-500 mt-1">{error}</div>}
                <button
                  type="submit"
                  class="w-full mt-2 bg-primary text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Gửi link đăng nhập
                </button>
                <div class="text-[10px] text-text-muted mt-2 text-center">
                  Không cần mật khẩu — chỉ cần nhấn link trong email
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div class="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        class="flex items-center gap-1.5"
      >
        <span class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
          {user.avatar_emoji}
        </span>
      </button>

      {showMenu && (
        <div class="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-44 z-50">
          <div class="px-3 py-2 border-b border-gray-100">
            <div class="text-sm font-semibold text-text">{user.display_name}</div>
            <div class="text-xs text-text-muted">{user.total_points} điểm • Hạng {user.tier}</div>
          </div>
          <button
            onClick={handleLogout}
            class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
