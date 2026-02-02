import { Movie } from '@/types/movie';
import { getImageUrl, tmdb } from '@/lib/tmdb';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useMemo, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { watchHistory } from '@/lib/watchHistory';

interface MovieCardProps {
  movie: Movie;
  mediaType: 'movie' | 'tv';
  showProgress?: boolean;
}

export const MovieCard = ({ movie, mediaType, showProgress = true }: MovieCardProps) => {
  const navigate = useNavigate();
  const { user, watchlist, add, remove } = useWatchlist();
  const title = movie.title || movie.name || '';
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get watch progress from history
  const progress = useMemo(() => {
    if (!showProgress) return 0;
    const history = watchHistory.getAll();
    const entry = history.find(h => h.id === movie.id);
    return entry?.progress || 0;
  }, [movie.id, showProgress]);

  const isInWatchLater = useMemo(
    () => watchlist.some((item) => item.media_id === movie.id),
    [watchlist, movie.id]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add to watchlist', {
        action: {
          label: 'Login',
          onClick: async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.href },
            });
          },
        },
      });
      return;
    }

    try {
      if (isInWatchLater) {
        await remove(movie.id);
        toast.success('Removed from Watch Later');
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
        toast.success('Added to Watch Later');
      }
    } catch (error: any) {
      console.error('Watchlist error:', error);
      toast.error(error?.message || 'Failed to update watchlist');
    }
  };

  return (
    <motion.div
      className="relative w-full cursor-pointer group"
      onClick={() => navigate(`/${mediaType}/${movie.id}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.15, ease: [0.2, 0, 0, 1] }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Card Container - Neo-Brutalist */}
      <div 
        className={`relative overflow-hidden border-3 border-foreground bg-card transition-all duration-150 ${
          isHovered 
            ? 'shadow-[8px_8px_0px_hsl(var(--primary))]' 
            : 'shadow-[4px_4px_0px_hsl(var(--foreground))]'
        }`}
        style={{ borderWidth: '3px' }}
      >
        {/* Poster */}
        <img
          src={getImageUrl(movie.poster_path, 'w500')}
          alt={title}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
        />

        {/* Hover Overlay */}
        <div 
          className={`absolute inset-0 bg-black/80 flex flex-col justify-end p-3 transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Title */}
          <h3 className="font-black text-white text-sm uppercase tracking-tight line-clamp-2 mb-2">
            {title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 font-bold">
              ★ {movie.vote_average.toFixed(1)}
            </span>
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 font-bold">
              {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 bg-primary text-primary-foreground font-black text-xs uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center justify-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${mediaType}/${movie.id}`);
              }}
            >
              <Play className="h-3 w-3 fill-current" />
              PLAY
            </button>
            <button
              className="p-2 bg-accent text-accent-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
              onClick={handleWatchLater}
            >
              {isInWatchLater ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Rating Badge - Always visible */}
        <div 
          className={`absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 font-black text-xs border-l-3 border-b-3 border-foreground transition-opacity duration-150 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ borderWidth: '0 0 3px 3px', borderColor: 'hsl(var(--foreground))' }}
        >
          ★ {movie.vote_average.toFixed(1)}
        </div>

        {/* Watch Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted border-t-2 border-foreground">
            <div 
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title Below - Neo-Brutalist */}
      <div className={`mt-3 transition-opacity duration-150 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <h3 className="font-black text-sm uppercase tracking-tight line-clamp-2">{title}</h3>
        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">
          {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]} • {mediaType}
        </p>
      </div>
    </motion.div>
  );
};

export default MovieCard;
