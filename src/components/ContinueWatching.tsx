import { HistoryEntry } from '@/lib/watchHistory';
import { MovieCard } from './MovieCard';

interface ContinueWatchingProps {
  items: HistoryEntry[];
}

export const ContinueWatching = ({ items }: ContinueWatchingProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold px-3 sm:px-4 lg:px-8">Continue Watching</h2>

      <div className="relative group">
        <div className="flex gap-3 sm:gap-4 overflow-x-scroll scrollbar-hide px-3 sm:px-4 lg:px-8 pb-4">
          {items.map((it) => (
            <div key={`${it.mediaType}-${it.id}`} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
              {/* MovieCard expects a Movie and mediaType prop; history entry shapes are compatible for display */}
              <MovieCard
                movie={{
                  id: it.id,
                  title: it.title,
                  name: it.name,
                  overview: '',
                  poster_path: it.poster_path || null,
                  backdrop_path: it.backdrop_path || null,
                  vote_average: 0,
                  vote_count: 0,
                  genre_ids: [],
                }}
                mediaType={it.mediaType}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContinueWatching;
