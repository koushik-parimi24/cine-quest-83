import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  mediaType: 'movie' | 'tv';
}

export const MovieRow = ({ title, movies, mediaType }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 800;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold px-3 sm:px-4 lg:px-8">{title}</h2>

      {/* Scrollable Container */}
      <div className="relative group">
        {/* Left Arrow - Hidden on mobile */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-10 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center hover:from-background/90"
        >
          <ChevronLeft className="h-8 w-8 bg-white text-black rounded-full" />
        </button>

        {/* Movies with staggered animations */}
        <div 
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-scroll scrollbar-hide px-3 sm:px-4 lg:px-8 pb-4 "
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'auto'
          }}
        >
          {movies.map((movie, index) => (
            <div 
              key={movie.id} 
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] animate-slide-up"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                animationDuration: '0.4s'
              }}
            >
              <MovieCard movie={movie} mediaType={mediaType} />
            </div>
          ))}
        </div>

        {/* Right Arrow - Hidden on mobile */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-16 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center hover:from-background/90"
        >
          <ChevronRight className="h-8 w-8 bg-white text-black rounded-full" />
        </button>
      </div>
    </div>
  );
};
