import { Movie } from '@/types/movie';
import { getImageUrl } from '@/lib/tmdb';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check } from 'lucide-react';
import { watchLaterService } from '@/lib/watchLater';
import { useState } from 'react';
import { toast } from 'sonner';

interface MovieCardProps {
  movie: Movie;
  mediaType: 'movie' | 'tv';
}

export const MovieCard = ({ movie, mediaType }: MovieCardProps) => {
  const navigate = useNavigate();
  const title = movie.title || movie.name || '';
  const [isInWatchLater, setIsInWatchLater] = useState(
    watchLaterService.isInWatchLater(movie.id)
  );

  const handleWatchLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    watchLaterService.toggle(movie);
    setIsInWatchLater(!isInWatchLater);
    toast.success(isInWatchLater ? 'Removed from Watch Later' : 'Added to Watch Later');
  };

  return (
    <div 
      className="group relative w-full cursor-pointer touch-manipulation"
      onClick={() => navigate(`/${mediaType}/${movie.id}`)}
      style={{ willChange: 'transform' }}
    >
      {/* Poster */}
      <div className="relative overflow-hidden rounded-lg shadow-[var(--shadow-card)] transition-transform duration-200 md:hover:scale-105">
        <img
          src={getImageUrl(movie.poster_path, 'w500')}
          alt={title}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
          decoding="async"
        />
        
        {/* Gradient Overlay - Desktop only */}
        <div className="absolute inset-0 bg-[var(--gradient-card)] opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Hover Actions - Desktop only */}
        <div className="absolute inset-0 hidden md:flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            className="p-3 rounded-full bg-[var(--gradient-primary)] transition-shadow hover:shadow-[var(--shadow-glow-bright)]"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${mediaType}/${movie.id}`);
            }}
          >
            <Play className="h-5 w-5 fill-current" />
          </button>
          <button 
            className="p-3 rounded-full bg-[var(--gradient-secondary)] transition-shadow hover:shadow-[var(--shadow-glow)]"
            onClick={handleWatchLater}
          >
            {isInWatchLater ? (
              <Check className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
          <span className="text-accent text-xs">★</span>
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
