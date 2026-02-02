import { useState, useEffect } from 'react';
import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { tmdb } from '@/lib/tmdb';
import { HistoryEntry } from '@/lib/watchHistory';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useRef } from 'react';

interface BecauseYouWatchedProps {
  historyItem: HistoryEntry;
}

export const BecauseYouWatched = ({ historyItem }: BecauseYouWatchedProps) => {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const data = await tmdb.getSimilar(historyItem.id, historyItem.mediaType);
        setRecommendations(data.results?.slice(0, 15) || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [historyItem.id, historyItem.mediaType]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    return () => scrollEl?.removeEventListener('scroll', handleScroll);
  }, [recommendations]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading || recommendations.length === 0) return null;

  const title = historyItem.title || historyItem.name || 'Unknown';

  return (
    <div className="space-y-4 mb-8 group/row">
      {/* Title - Brutalist with "Because You Watched" styling */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="px-3 sm:px-4 lg:px-8"
      >
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1">
          <History className="h-3 w-3" strokeWidth={2.5} />
          BECAUSE YOU WATCHED
        </div>
        <div className="flex items-center gap-4">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-primary">
            {title}
          </h2>
          <div className="h-1 flex-1 max-w-24 bg-primary/50" />
        </div>
      </motion.div>

      {/* Scrollable Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 ${
            showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={3} />
        </button>

        {/* Movies Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-scroll overflow-y-visible scrollbar-hide px-3 sm:px-4 lg:px-8 pt-4 pb-8"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {recommendations.map((movie, index) => (
            <motion.div 
              key={movie.id} 
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: Math.min(index * 0.03, 0.3),
                duration: 0.2,
                ease: [0.2, 0, 0, 1]
              }}
            >
              <MovieCard movie={movie} mediaType={historyItem.mediaType} />
            </motion.div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 ${
            showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default BecauseYouWatched;
