import { Movie } from '@/types/movie';

const STORAGE_KEY = 'watchHistory';
const MAX_ITEMS = 12;

export type HistoryEntry = {
  id: number;
  mediaType: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  lastWatchedAt: number;
  progress?: number; 
  vote_average?: number;
  vote_count?: number;
};

export const watchHistory = {
  getAll: (): HistoryEntry[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  add: (movie: Movie, mediaType: 'movie' | 'tv' = 'movie', progress?: number) => {
    const current: HistoryEntry[] = watchHistory.getAll();
    const now = Date.now();
    const entry: HistoryEntry = {
      id: movie.id,
      mediaType,
      title: movie.title,
      name: movie.name,
      poster_path: movie.poster_path || null,
      backdrop_path: movie.backdrop_path || null,
      lastWatchedAt: now,
      vote_average: movie.vote_average,
      vote_count:movie.vote_count,
      progress,
    };

    // Remove any existing entry for this id
    const filtered = current.filter(c => c.id !== movie.id);
    // Insert to front
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  remove: (id: number) => {
    const current = watchHistory.getAll();
    const updated = current.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export default watchHistory;
