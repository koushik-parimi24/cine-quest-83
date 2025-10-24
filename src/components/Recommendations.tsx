import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';

interface RecommendationsProps {
  movies: (Movie & { mediaType?: 'movie' | 'tv' })[];
  title?: string;
}

export const Recommendations = ({ movies, title = 'Recommended for you' }: RecommendationsProps) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold px-3 sm:px-4 lg:px-8">{title}</h2>

      <div className="relative group">
        <div className="flex gap-3 sm:gap-4 overflow-x-scroll scrollbar-hide px-3 sm:px-4 lg:px-8 pb-4">
          {movies.map((movie) => (
            <div key={movie.id} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
              <MovieCard movie={movie} mediaType={(movie as any).mediaType || 'movie'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
