import { Movie } from '@/types/movie';
import { getBackdropUrl } from '@/lib/tmdb';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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

  // Swipe handler for mobile
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      goToPrev();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  return (
    <motion.div 
      className="relative h-[70vh] sm:h-[75vh] lg:h-[85vh] w-full overflow-hidden bg-background touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
    >
      {/* Background Image */}
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
          {/* Harsh gradient overlay for brutalist look */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Brutalist Style (positioned higher to avoid badge overlap) */}
      <button
        onClick={goToPrev}
        className="absolute left-2 sm:left-4 top-1/3 z-20 p-2 sm:p-3 bg-primary text-primary-foreground border-2 sm:border-3 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-100"
        style={{ borderWidth: '2px' }}
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={3} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/3 z-20 p-2 sm:p-3 bg-primary text-primary-foreground border-2 sm:border-3 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-100"
        style={{ borderWidth: '2px' }}
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={3} />
      </button>

      {/* Content */}
      <div className="relative z-10 flex h-full items-end pb-32 sm:pb-40">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMovie.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              className="max-w-3xl space-y-4 sm:space-y-6"
            >
              {/* Title - Brutalist Typography */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black uppercase leading-none tracking-tighter text-foreground">
                {title}
              </h1>

              {/* Meta Info - Bold Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-primary text-primary-foreground px-3 py-1.5 font-black text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  ★ {currentMovie.vote_average.toFixed(1)}
                </span>
                <span className="bg-secondary text-secondary-foreground px-3 py-1.5 font-black text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  {currentMovie.release_date?.split('-')[0] || currentMovie.first_air_date?.split('-')[0]}
                </span>
                <span className="bg-accent text-accent-foreground px-3 py-1.5 font-black text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  {mediaType === 'movie' ? 'MOVIE' : 'TV SERIES'}
                </span>
              </div>

              {/* Overview */}
              <p className="text-sm sm:text-base lg:text-lg font-medium text-foreground/80 line-clamp-2 sm:line-clamp-3 max-w-2xl">
                {currentMovie.overview}
              </p>

              {/* Action Buttons - Brutalist */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button 
                  className="px-6 sm:px-8 py-3 bg-primary text-primary-foreground font-black text-sm sm:text-base uppercase tracking-wide border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 flex items-center gap-2"
                  style={{ borderWidth: '3px' }}
                  onClick={() => navigate(`/${mediaType}/${currentMovie.id}`)}
                >
                  <Play className="h-5 w-5 fill-current" />
                  PLAY NOW
                </button>
                <button 
                  className="px-6 sm:px-8 py-3 bg-background text-foreground font-black text-sm sm:text-base uppercase tracking-wide border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 flex items-center gap-2"
                  style={{ borderWidth: '3px' }}
                  onClick={() => navigate(`/${mediaType}/${currentMovie.id}`)}
                >
                  <Info className="h-5 w-5" />
                  MORE INFO
                </button>
                <button 
                  className="p-3 bg-accent text-accent-foreground border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100"
                  style={{ borderWidth: '3px' }}
                  onClick={handleWatchLater}
                >
                  {isInWatchLater ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    <Plus className="h-5 w-5" strokeWidth={3} />
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dots Navigation - Brutalist Style */}
      <div className="absolute bottom-24 sm:bottom-28 left-0 right-0 z-20">
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
              {/* Progress fill for active */}
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
