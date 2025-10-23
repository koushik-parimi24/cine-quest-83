import { Movie } from '@/types/movie';
import { getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Play, Plus, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { watchLaterService } from '@/lib/watchLater';
import { toast } from 'sonner';

interface HeroProps {
  movie: Movie;
  mediaType: 'movie' | 'tv';
}

export const Hero = ({ movie, mediaType }: HeroProps) => {
  const navigate = useNavigate();
  const title = movie.title || movie.name || '';
  const isInWatchLater = watchLaterService.isInWatchLater(movie.id);

  const handleWatchLater = () => {
    watchLaterService.toggle(movie);
    toast.success(isInWatchLater ? 'Removed from Watch Later' : 'Added to Watch Later');
  };

  return (
    <div className="relative h-[85vh] w-full overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl space-y-6 animate-fade-in">
            {/* Title */}
            <h1 className="text-5xl font-black leading-tight lg:text-7xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
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
            <p className="text-lg leading-relaxed text-foreground/90 line-clamp-3">
              {movie.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                size="lg"
                className="bg-[var(--gradient-primary)] hover:opacity-90 font-bold shadow-[var(--shadow-glow)]"
                onClick={() => navigate(`/${mediaType}/${movie.id}`)}
              >
                <Play className="mr-2 h-5 w-5 fill-current" />
                Watch Now
              </Button>
              <Button 
                size="lg"
                variant="secondary"
                className="bg-secondary/50 backdrop-blur-sm hover:bg-secondary/70"
                onClick={() => navigate(`/${mediaType}/${movie.id}`)}
              >
                <Info className="mr-2 h-5 w-5" />
                More Info
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-border/50 backdrop-blur-sm hover:border-accent hover:text-accent"
                onClick={handleWatchLater}
              >
                <Plus className="mr-2 h-5 w-5" />
                {isInWatchLater ? 'Remove' : 'Watch Later'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
