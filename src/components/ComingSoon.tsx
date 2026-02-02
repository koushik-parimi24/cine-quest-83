import { useState, useEffect, useRef } from 'react';
import { Movie } from '@/types/movie';
import { getImageUrl } from '@/lib/tmdb';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ComingSoonProps {
  movies: Movie[];
  mediaType: 'movie' | 'tv';
}

// Simple local storage for notifications
const getNotifiedMovies = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem('notifiedMovies') || '[]');
  } catch {
    return [];
  }
};

const toggleNotification = (movieId: number): boolean => {
  const notified = getNotifiedMovies();
  const isNotified = notified.includes(movieId);
  
  if (isNotified) {
    localStorage.setItem('notifiedMovies', JSON.stringify(notified.filter(id => id !== movieId)));
    return false;
  } else {
    localStorage.setItem('notifiedMovies', JSON.stringify([...notified, movieId]));
    return true;
  }
};

export const ComingSoon = ({ movies, mediaType }: ComingSoonProps) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [notifiedMovies, setNotifiedMovies] = useState<number[]>([]);

  // Filter for upcoming movies (release date in the future)
  const upcomingMovies = movies.filter(movie => {
    const releaseDate = movie.release_date || movie.first_air_date;
    if (!releaseDate) return false;
    return new Date(releaseDate) > new Date();
  }).slice(0, 15);

  useEffect(() => {
    setNotifiedMovies(getNotifiedMovies());
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    return () => scrollEl?.removeEventListener('scroll', handleScroll);
  }, [upcomingMovies]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleNotify = (e: React.MouseEvent, movieId: number, title: string) => {
    e.stopPropagation();
    const isNowNotified = toggleNotification(movieId);
    setNotifiedMovies(getNotifiedMovies());
    
    if (isNowNotified) {
      toast.success(`You'll be notified when "${title}" releases!`);
    } else {
      toast.info(`Notification removed for "${title}"`);
    }
  };

  const formatReleaseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else if (diffDays <= 30) {
      const weeks = Math.ceil(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} left`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (upcomingMovies.length === 0) return null;

  return (
    <div className="space-y-4 mb-8 group/row">
      {/* Title - Brutalist */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="px-3 sm:px-4 lg:px-8 flex items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent text-accent-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
            <Calendar className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            COMING SOON
          </h2>
        </div>
        <div className="h-1 flex-1 max-w-32 bg-accent" />
      </motion.div>

      {/* Scrollable Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-accent text-accent-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 ${
            showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={3} />
        </button>

        {/* Movies Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-scroll overflow-y-visible scrollbar-hide px-3 sm:px-4 lg:px-8 pt-4 pb-8"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {upcomingMovies.map((movie, index) => {
            const title = movie.title || movie.name || '';
            const releaseDate = movie.release_date || movie.first_air_date || '';
            const isNotified = notifiedMovies.includes(movie.id);
            
            return (
              <motion.div 
                key={movie.id} 
                className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] lg:w-[280px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: Math.min(index * 0.05, 0.3),
                  duration: 0.2,
                  ease: [0.2, 0, 0, 1]
                }}
              >
                {/* Card - Brutalist Horizontal Style */}
                <div 
                  className="relative bg-card border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-[6px_6px_0px_hsl(var(--accent))] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-150 cursor-pointer overflow-hidden"
                  style={{ borderWidth: '3px' }}
                  onClick={() => navigate(`/${mediaType}/${movie.id}`)}
                >
                  {/* Backdrop Image */}
                  <div className="relative h-32 sm:h-36">
                    <img
                      src={getImageUrl(movie.backdrop_path || movie.poster_path, 'w500')}
                      alt={title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Countdown Badge */}
                    <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                      {formatReleaseDate(releaseDate)}
                    </div>
                    {/* Notify Button */}
                    <button
                      onClick={(e) => handleNotify(e, movie.id, title)}
                      className={`absolute top-2 right-2 p-1.5 border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 ${
                        isNotified 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background text-foreground'
                      }`}
                    >
                      {isNotified ? (
                        <Bell className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
                      ) : (
                        <BellOff className="h-3 w-3" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-black text-sm uppercase truncate mb-1">{title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{movie.overview}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-accent text-accent-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 ${
            showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
