import { Movie } from '@/types/movie';

const STORAGE_KEY = 'watchLater';

export const watchLaterService = {
  getAll: (): Movie[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  add: (movie: Movie) => {
    const current = watchLaterService.getAll();
    const exists = current.some(m => m.id === movie.id);
    if (!exists) {
      const updated = [...current, movie];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  remove: (movieId: number) => {
    const current = watchLaterService.getAll();
    const updated = current.filter(m => m.id !== movieId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  isInWatchLater: (movieId: number): boolean => {
    const current = watchLaterService.getAll();
    return current.some(m => m.id === movieId);
  },

  toggle: (movie: Movie) => {
    if (watchLaterService.isInWatchLater(movie.id)) {
      watchLaterService.remove(movie.id);
    } else {
      watchLaterService.add(movie);
    }
  }
};
