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
    <div className="space-y-4 mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold px-4 lg:px-8">{title}</h2>

      {/* Scrollable Container */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:from-background/90"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        {/* Movies */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 lg:px-8 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} mediaType={mediaType} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:from-background/90"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};
