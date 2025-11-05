import { Movie } from '@/types/movie';
import { getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Plus, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useWatchlist } from '@/hooks/useWatchlist';
import { supabase } from '@/lib/supabaseClient';

interface HeroProps {
  movie: Movie;
  mediaType: 'movie' | 'tv';
}

export const Hero = ({ movie, mediaType }: HeroProps) => {
  const navigate = useNavigate();
  const { user, watchlist, add, remove } = useWatchlist();
  const title = movie.title || movie.name || '';
  
  const isInWatchLater = useMemo(
    () => watchlist.some(item => item.media_id === movie.id),
    [watchlist, movie.id]
  );

  // Crossfade state for smooth backdrop transitions
  const [prevBackdrop, setPrevBackdrop] = useState<string | null>(null);
  const [currBackdrop, setCurrBackdrop] = useState<string>(getBackdropUrl(movie.backdrop_path));
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const next = getBackdropUrl(movie.backdrop_path);
    if (next === currBackdrop) return; // no change

    // keep current as previous, set new current, then trigger fade
    setPrevBackdrop(currBackdrop);
    setCurrBackdrop(next);
    setFadeIn(false);

    // small delay so the browser registers the starting opacity, then fade
    const start = window.setTimeout(() => setFadeIn(true), 50);
    // cleanup after animation (700ms transition + small buffer)
    const clean = window.setTimeout(() => {
      setPrevBackdrop(null);
      setFadeIn(false);
    }, 900);

    return () => {
      clearTimeout(start);
      clearTimeout(clean);
    };
  }, [movie.backdrop_path]);

  const handleWatchLater = async () => {
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

    if (!movie.id) {
      console.error('Movie ID is missing:', movie);
      toast.error('Unable to add - movie ID missing');
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
    <div className="relative h-[55vh] w-full overflow-hidden animate-fade-in">
      {/* Background Image with Gradient Overlay and smooth crossfade between images */}
      <div className="absolute inset-0">
        {/* Previous backdrop (fades out) */}
        {prevBackdrop && (
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out`}
            style={{
              backgroundImage: `url(${prevBackdrop})`,
              opacity: fadeIn ? 0 : 1,
              willChange: 'opacity, transform',
            }}
          />
        )}

        {/* Current backdrop (fades in) */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out`}
          style={{
            backgroundImage: `url(${currBackdrop})`,
            opacity: prevBackdrop ? (fadeIn ? 1 : 0) : 1,
            willChange: 'opacity, transform',
            transform: 'scale(1.02)'
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" style={{ animationDelay: '0.2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl space-y-6 animate-slide-up" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }}>
            {/* Title */}
            <h1 className="text-2xl font-black leading-tight lg:text-7xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text ">
              {title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="text-accent font-bold">★</span>
                {movie.vote_average.toFixed(1)}
              </span>
              <span>•</span>
              <span>{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
              <span>•</span>
              <span className="uppercase tracking-wider">{mediaType}</span>
            </div>

            {/* Overview */}
            <p className="text-sm lg:text-lg leading-relaxed text-foreground/90 line-clamp-3">
              {movie.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex  gap-3 sm:gap-4 pt-4">
              <Button 
                size="lg"
                className=" bg-red-700 hover:shadow-[var(--shadow-glow-bright)] font-bold transition-all hover:scale-105 touch-manipulation"
                onClick={() => navigate(`/${mediaType}/${movie.id}`)}
              >
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                Watch Now
              </Button>
                <Button 
                size="lg"
                variant="outline"
                className="border-accent/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover:scale-105 touch-manipulation"
                onClick={handleWatchLater}
              >
                {isInWatchLater ? (
                  <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                )}
                {isInWatchLater ? 'In Watchlist' : 'Watch Later'}
              </Button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
