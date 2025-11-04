import { createContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// -------------------------
// 🧩 Types
// -------------------------

// TMDB-like movie or show
export interface WatchItem {
  id?: number;
  user_id?: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  inserted_at?: string;
}

// Context value type
interface WatchlistContextType {
  user: User | null;
  watchlist: WatchItem[];
  add: (item: WatchItem) => Promise<void>;
  remove: (media_id: number) => Promise<void>;
}

// Provider props
interface WatchlistProviderProps {
  children: ReactNode;
}

// -------------------------
// 🧠 Context + Provider
// -------------------------

export const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider = ({ children }: WatchlistProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  // ✅ Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub?.subscription?.unsubscribe();
  }, []);

  // ✅ Load user watchlist
  const load = async () => {
    if (!user) return setWatchlist([]);

    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.id)
      .order('inserted_at', { ascending: false });

    if (error) {
      console.error('Failed to load watchlist:', error.message);
    } else {
      setWatchlist(data ?? []);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  // ✅ Add to watchlist (with optimistic update)
  const add = async (item: WatchItem) => {
    if (!user) return;

    const newItem: WatchItem = {
      user_id: user.id,
      media_id: item.id!,
      media_type: item.media_type ?? (item.title ? 'movie' : 'tv'),
      title: item.title || item.original_title || item.original_name,
      original_title: item.original_title,
      original_name: item.original_name,
      poster_path: item.poster_path,
      release_date: item.release_date || item.first_air_date,
      first_air_date: item.first_air_date,
      vote_average: item.vote_average,
    };

    const { error } = await supabase
      .from('watchlists')
    .upsert([newItem], { onConflict: 'user_id,media_id' });

    if (error) {
      console.error('Add error:', error.message);
    } else {
      setWatchlist((prev) => [newItem, ...prev.filter((w) => w.media_id !== newItem.media_id)]);
    }
  };

  // ✅ Remove from watchlist (with optimistic update)
  const remove = async (media_id: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .match({ user_id: user.id, media_id });

    if (error) {
      console.error('Remove error:', error.message);
    } else {
      setWatchlist((prev) => prev.filter((w) => w.media_id !== media_id));
    }
  };

  return (
    <WatchlistContext.Provider value={{ user, watchlist, add, remove }}>
      {children}
    </WatchlistContext.Provider>
  );
};
