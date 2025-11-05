import { HistoryEntry, watchHistory } from '@/lib/watchHistory';
import { MovieCard } from './MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface ContinueWatchingProps {
  items: HistoryEntry[];
  onUpdate?: () => void; // optional refresh callback
}

export const ContinueWatching = ({ items: initialItems, onUpdate }: ContinueWatchingProps) => {
  const [items, setItems] = useState(initialItems);

  // 🗑️ Remove a single movie
  const handleRemove = (id: number) => {
    watchHistory.remove(id);
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    onUpdate?.();
    toast.success('Removed from history');
  };

  // 🔥 Clear all watch history
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
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
     
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold">Continue Watching</h2>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearAll}
          className="text-xs sm:text-sm px-3 py-1 hover:bg-red-600"
        >
         <Trash2/> Clear All
        </Button>
      </div>

      
      <div className="relative group">
        <div className="flex gap-3 sm:gap-4 overflow-x-scroll scrollbar-hide px-3 sm:px-4 lg:px-8 pb-4">
          <AnimatePresence>
            {items.map((it) => (
              <motion.div
                key={`${it.mediaType}-${it.id}`}
                className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                
                <button
                  onClick={() => handleRemove(it.id)}
                  className="absolute top-1 left-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 z-10"
                  title="Remove from history"
                >
                  <X className="h-4 w-4" />
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
