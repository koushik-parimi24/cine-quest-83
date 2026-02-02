import { Movie } from '@/types/movie';
import { getImageUrl } from '@/lib/tmdb';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

interface TopTenRowProps {
  title: string;
  movies: Movie[];
  mediaType: 'movie' | 'tv';
}

const TopTenCard = ({ 
  movie, 
  rank, 
  mediaType 
}: { 
  movie: Movie; 
  rank: number; 
  mediaType: 'movie' | 'tv';
}) => {
  const navigate = useNavigate();
  const { user, watchlist, add, remove } = useWatchlist();

  const isInWatchLater = useMemo(
    () => watchlist.some((item) => item.media_id === movie.id),
    [watchlist, movie.id]
  );

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.error('Please login');
      return;
    }

    try {
      if (isInWatchLater) {
        await remove(movie.id);
        toast.success('Removed');
      } else {
        await add({
          media_id: movie.id,
          media_type: mediaType,
          title: movie.title || movie.name,
          original_title: movie.title,
          original_name: movie.name,
          poster_path: movie.poster_path || undefined,
          release_date: movie.release_date,
          first_air_date: movie.first_air_date,
          vote_average: movie.vote_average,
        });
        toast.success('Added');
      }
    } catch (error) {
      toast.error('Failed');
    }
  };

  return (
    <motion.div
      className="relative flex-shrink-0 flex items-end cursor-pointer group"
      onClick={() => navigate(`/${mediaType}/${movie.id}`)}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
    >
      {/* Large Rank Number - Brutalist */}
      <div className="relative z-10 flex items-end justify-center w-16 sm:w-20 md:w-24">
        <span 
          className="text-7xl sm:text-8xl md:text-9xl font-black leading-none select-none"
          style={{
            WebkitTextStroke: '4px hsl(var(--foreground))',
            WebkitTextFillColor: 'hsl(var(--primary))',
            textShadow: '4px 4px 0px hsl(var(--foreground))'
          }}
        >
          {rank}
        </span>
      </div>

      {/* Poster Card - Brutalist */}
      <div 
        className="relative -ml-4 w-[100px] sm:w-[120px] md:w-[140px] border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] group-hover:shadow-[6px_6px_0px_hsl(var(--primary))] transition-all duration-150 overflow-hidden"
        style={{ borderWidth: '3px' }}
      >
        <img
          src={getImageUrl(movie.poster_path, 'w200')}
          alt={movie.title || movie.name || ''}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-end p-2">
          <div className="flex gap-1">
            <button 
              className="flex-1 py-1.5 bg-primary text-primary-foreground text-xs font-black uppercase border-2 border-foreground flex items-center justify-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${mediaType}/${movie.id}`);
              }}
            >
              <Play className="h-3 w-3 fill-current" />
            </button>
            <button
              onClick={handleWatchLater}
              className="p-1.5 bg-accent text-accent-foreground border-2 border-foreground"
            >
              {isInWatchLater ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <Plus className="h-3 w-3" strokeWidth={3} />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const TopTenRow = ({ title, movies, mediaType }: TopTenRowProps) => {
  const topTen = movies.slice(0, 10);

  return (
    <div className="space-y-4 mb-8">
      {/* Section Title - Brutalist */}
      <div className="px-3 sm:px-4 lg:px-8 flex items-center gap-4">
        <div className="bg-primary text-primary-foreground px-4 py-2 border-3 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]" style={{ borderWidth: '3px' }}>
          <span className="text-xl sm:text-2xl font-black uppercase tracking-tight">TOP 10</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">{title}</h2>
        <div className="h-1 flex-1 max-w-32 bg-accent" />
      </div>

      {/* Scrollable Row */}
      <div className="relative">
        <div className="flex gap-2 sm:gap-4 overflow-x-scroll overflow-y-visible scrollbar-hide px-3 sm:px-4 lg:px-8 pt-4 pb-8">
          {topTen.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: index * 0.05, 
                duration: 0.2,
                ease: [0.2, 0, 0, 1]
              }}
            >
              <TopTenCard
                movie={movie}
                rank={index + 1}
                mediaType={mediaType}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopTenRow;
