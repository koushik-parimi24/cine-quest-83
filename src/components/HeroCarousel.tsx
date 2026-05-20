import { Movie } from '@/types/movie';
import { getBackdropUrl } from '@/lib/tmdb';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Play, Plus, Info, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useWatchlist } from '@/hooks/useWatchlist';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroCarouselProps {
  movies: Movie[];
  mediaType: 'movie' | 'tv';
}

const SLIDE_DURATION = 6000;

export const HeroCarousel = ({ movies, mediaType }: HeroCarouselProps) => {
  const navigate = useNavigate();
  const { user, watchlist, add, remove } = useWatchlist();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const featuredMovies = movies.slice(0, 5);
  const currentMovie = featuredMovies[currentIndex];

  const title = currentMovie?.title || currentMovie?.name || '';

  const isInWatchLater = useMemo(
    () => watchlist.some(item => item.media_id === currentMovie?.id),
    [watchlist, currentMovie?.id]
  );

  useEffect(() => {
    if (featuredMovies.length <= 1 || isHovered) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / SLIDE_DURATION) * 100;

      if (newProgress >= 100) {
        setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, featuredMovies.length, isHovered]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
    setProgress(0);
  }, [featuredMovies.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    setProgress(0);
  }, [featuredMovies.length]);

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

    if (!currentMovie?.id) {
      toast.error('Unable to add - movie ID missing');
      return;
    }

    try {
      if (isInWatchLater) {
        await remove(currentMovie.id);
        toast.success('Removed from Watch Later');
      } else {
        await add({
          media_id: currentMovie.id,
          media_type: mediaType,
          title: currentMovie.title || currentMovie.name,
          original_title: currentMovie.title,
          original_name: currentMovie.name,
          poster_path: currentMovie.poster_path || undefined,
          release_date: currentMovie.release_date,
          first_air_date: currentMovie.first_air_date,
          vote_average: currentMovie.vote_average,
        });
        toast.success('Added to Watch Later');
      }
    } catch (error: any) {
      console.error('Watchlist error:', error);
      toast.error(error?.message || 'Failed to update watchlist');
    }
  };

  if (!currentMovie) return null;

  const handleDragEnd = (_event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      goToPrev();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  return (
    <motion.div
      className="relative h-[68svh] min-h-[480px] sm:min-h-[560px] lg:h-[84vh] w-full overflow-hidden bg-background touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${getBackdropUrl(currentMovie.backdrop_path)})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-background/35" />
        </motion.div>
      </AnimatePresence>

      <button
        onClick={goToPrev}
        className="absolute left-3 top-24 hidden z-20 p-2 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] transition-all duration-100 hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] sm:flex sm:top-1/2 sm:-translate-y-1/2 sm:left-4 sm:p-3 sm:shadow-[4px_4px_0px_hsl(var(--foreground))] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px]"
        style={{ borderWidth: '2px' }}
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={3} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-3 top-24 hidden z-20 p-2 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] transition-all duration-100 hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] sm:flex sm:top-1/2 sm:-translate-y-1/2 sm:right-4 sm:p-3 sm:shadow-[4px_4px_0px_hsl(var(--foreground))] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px]"
        style={{ borderWidth: '2px' }}
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={3} />
      </button>

      <div className="relative z-10 flex h-full items-end pb-28 sm:pb-36 lg:pb-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMovie.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              className="hero-panel max-w-3xl space-y-4 border-3 border-foreground p-4 shadow-[6px_6px_0px_hsl(var(--foreground))] sm:space-y-6 sm:p-6 lg:max-w-4xl"
              style={{ borderWidth: '3px' }}
            >
              <h1 className="max-w-[12ch] text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] font-black uppercase leading-[0.9] tracking-tighter text-foreground">
                {title}
              </h1>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="bg-primary text-primary-foreground px-3 py-1.5 font-black text-[11px] sm:text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  SCORE {currentMovie.vote_average.toFixed(1)}
                </span>
                <span className="bg-secondary text-secondary-foreground px-3 py-1.5 font-black text-[11px] sm:text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  {currentMovie.release_date?.split('-')[0] || currentMovie.first_air_date?.split('-')[0]}
                </span>
                <span className="bg-accent text-accent-foreground px-3 py-1.5 font-black text-[11px] sm:text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  {mediaType === 'movie' ? 'MOVIE' : 'TV SERIES'}
                </span>
              </div>

              <p className="max-w-2xl text-sm sm:text-base lg:text-lg font-medium text-foreground/80 line-clamp-3 sm:line-clamp-4">
                {currentMovie.overview}
              </p>

              <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
                <button
                  className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-primary text-primary-foreground font-black text-xs sm:text-sm md:text-base uppercase tracking-wide border-2 sm:border-3 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-100 flex items-center justify-center gap-1.5 sm:gap-2"
                  style={{ borderWidth: '2px' }}
                  onClick={() => navigate(`/${mediaType}/${currentMovie.id}`)}
                >
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  PLAY NOW
                </button>
                <button
                  className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-background text-foreground font-black text-xs sm:text-sm md:text-base uppercase tracking-wide border-2 sm:border-3 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-100 flex items-center justify-center gap-1.5 sm:gap-2"
                  style={{ borderWidth: '2px' }}
                  onClick={() => navigate(`/${mediaType}/${currentMovie.id}`)}
                >
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  MORE INFO
                </button>
                <button
                  className="w-full sm:w-auto p-2.5 sm:p-3 bg-accent text-accent-foreground border-2 sm:border-3 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-100 flex items-center justify-center"
                  style={{ borderWidth: '2px' }}
                  onClick={handleWatchLater}
                >
                  {isInWatchLater ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
                  ) : (
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-16 sm:bottom-24 left-0 right-0 z-20">
        <div className="flex items-center justify-center gap-3">
          {featuredMovies.map((movie, index) => (
            <button
              key={movie.id}
              onClick={() => goToSlide(index)}
              className={`relative transition-all duration-150 ${
                index === currentIndex
                  ? 'w-12 h-3 bg-primary border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]'
                  : 'w-3 h-3 bg-muted border-2 border-foreground hover:bg-accent'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index === currentIndex && (
                <div
                  className="absolute inset-0 bg-accent origin-left"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HeroCarousel;
