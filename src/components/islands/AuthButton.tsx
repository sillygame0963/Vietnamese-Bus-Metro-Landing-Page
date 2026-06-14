import { useState, useEffect } from 'preact/hooks';
import { getSupabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';

export default function AuthButton() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
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

  async function handleLogin() {
    await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
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
      <button
        onClick={handleLogin}
        class="text-sm font-semibold text-white bg-primary px-3 py-1.5 rounded-full hover:bg-primary-dark transition-colors"
      >
        Đăng nhập
      </button>
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
        <span class="text-xs font-medium text-text hidden">
          {user.total_points}⭐
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
