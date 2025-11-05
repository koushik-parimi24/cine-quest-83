  import { Movie } from '@/types/movie';
  import { getImageUrl } from '@/lib/tmdb';
  import { useNavigate } from 'react-router-dom';
  import { Play, Plus, Check, LogIn } from 'lucide-react';
  import { toast } from 'sonner';
  import { useWatchlist } from '@/hooks/useWatchlist';
  import { useMemo } from 'react';
  import { supabase } from '@/lib/supabaseClient';

  interface MovieCardProps {
    movie: Movie;
    mediaType: 'movie' | 'tv';
  }

  export const MovieCard = ({ movie, mediaType }: MovieCardProps) => {
    const navigate = useNavigate();
    const { user, watchlist, add, remove } = useWatchlist();
    const title = movie.title || movie.name || '';
    
    const isInWatchLater = useMemo(
      () => watchlist.some(item => item.media_id === movie.id),
      [watchlist, movie.id]
    );

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
        if (!movie.id) {
          console.error('Movie ID is missing:', movie);
          toast.error('Unable to add - movie ID missing');
          return;
        }

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
      <div 
        className="group relative w-full cursor-pointer touch-manipulation animate-fade-in hover-lift"
        onClick={() => navigate(`/${mediaType}/${movie.id}`)}
        style={{ willChange: 'transform' }}
      >
        {/* Poster */}
        <div className="relative overflow-hidden rounded-lg shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-glow)] hover:scale-105">
          <img
            src={getImageUrl(movie.poster_path, 'w500')}
            alt={title}
            className="w-full aspect-[2/3] object-cover"
            loading="lazy"
            decoding="async"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-[var(--gradient-card)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Action Icons - Always visible on hover, mobile friendly */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button 
              className="p-3 rounded-full bg-[var(--gradient-primary)] shadow-lg hover:shadow-[var(--shadow-glow-bright)] transition-all hover:scale-110 animate-bounce-in"
              style={{ animationDelay: '0.1s' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${mediaType}/${movie.id}`);
              }}
            >
              <Play className="h-5 w-5 text-white" />
            </button>
            <button 
              className="p-3 rounded-full bg-[var(--gradient-secondary)] shadow-lg hover:shadow-[var(--shadow-glow)] transition-all hover:scale-110 animate-bounce-in"
              style={{ animationDelay: '0.2s' }}
              onClick={handleWatchLater}
            >
              {isInWatchLater ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <Plus className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          {/* Rating Badge with pulse animation */}
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 animate-fade-in shadow-lg">
            <span className="text-accent text-xs animate-pulse">★</span>
            <span className="text-xs font-bold">{movie.vote_average.toFixed(1)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 font-semibold text-sm line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
        </p>
      </div>
    );
  };
