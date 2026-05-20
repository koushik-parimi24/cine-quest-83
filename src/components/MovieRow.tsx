import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  mediaType: 'movie' | 'tv';
}

export const MovieRow = ({ title, movies, mediaType }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-4 mb-8 group/row">
      {/* Title - Brutalist */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="px-3 sm:px-4 lg:px-8 flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          {title}
        </h2>
        <div className="h-1 min-w-12 flex-1 max-w-32 bg-primary" />
      </motion.div>

      {/* Scrollable Container */}
      <div className="relative">
        {/* Left Arrow - Brutalist */}
        <button
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 ${
            showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={3} />
        </button>

        {/* Movies Container - Added pt-4 for hover space */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-scroll overflow-y-visible scrollbar-hide px-3 sm:px-4 lg:px-8 pt-4 pb-8"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {movies.map((movie, index) => (
            <motion.div 
              key={movie.id} 
              className="row-card flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: Math.min(index * 0.03, 0.3),
                duration: 0.2,
                ease: [0.2, 0, 0, 1]
              }}
            >
              <MovieCard movie={movie} mediaType={mediaType} />
            </motion.div>
          ))}
        </div>

        {/* Right Arrow - Brutalist */}
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

export default MovieRow;
