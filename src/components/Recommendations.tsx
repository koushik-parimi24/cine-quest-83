import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { motion } from 'framer-motion';

interface RecommendationsProps {
  movies: (Movie & { mediaType?: 'movie' | 'tv' })[];
  title?: string;
}

export const Recommendations = ({ movies, title = 'RECOMMENDED FOR YOU' }: RecommendationsProps) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      {/* Title - Brutalist */}
      <div className="px-3 sm:px-4 lg:px-8 flex items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{title}</h2>
        <div className="h-1 flex-1 max-w-32 bg-secondary" />
      </div>

      {/* Scrollable Row */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-scroll overflow-y-visible scrollbar-hide px-3 sm:px-4 lg:px-8 pt-4 pb-8">
          {movies.map((movie, index) => (
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
              <MovieCard movie={movie} mediaType={(movie as any).mediaType || 'movie'} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
