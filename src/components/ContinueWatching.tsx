import { HistoryEntry, watchHistory } from '@/lib/watchHistory';
import { MovieCard } from './MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContinueWatchingProps {
  items: HistoryEntry[];
  onUpdate?: () => void;
}

export const ContinueWatching = ({ items: initialItems, onUpdate }: ContinueWatchingProps) => {
  const [items, setItems] = useState(initialItems);

  const handleRemove = (id: number) => {
    watchHistory.remove(id);
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    onUpdate?.();
    toast.success('Removed from history');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all watch history?')) {
      watchHistory.clear();
      setItems([]);
      onUpdate?.();
      toast.success('Watch history cleared');
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      {/* Header - Brutalist */}
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            CONTINUE WATCHING
          </h2>
          <div className="h-1 w-16 sm:w-24 bg-secondary" />
        </div>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          <Trash2 className="h-3 w-3" strokeWidth={2.5} />
          CLEAR
        </button>
      </div>

      {/* Scrollable Row */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-scroll overflow-y-visible scrollbar-hide px-3 sm:px-4 lg:px-8 pt-4 pb-8">
          <AnimatePresence>
            {items.map((it) => (
              <motion.div
                key={`${it.mediaType}-${it.id}`}
                className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
              >
                {/* Remove button - Brutalist */}
                <button
                  onClick={() => handleRemove(it.id)}
                  className="absolute top-0 left-0 bg-destructive text-destructive-foreground p-1.5 z-10 border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                  title="Remove from history"
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                </button>

                <MovieCard
                  movie={{
                    id: it.id,
                    title: it.title,
                    name: it.name,
                    overview: '',
                    poster_path: it.poster_path || null,
                    backdrop_path: it.backdrop_path || null,
                    vote_average: it.vote_average || 0,
                    vote_count: it.vote_count || 0,
                    genre_ids: [],
                  }}
                  mediaType={it.mediaType}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ContinueWatching;
