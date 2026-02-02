import { useState, useEffect } from 'react';
import { Genre } from '@/types/movie';
import { tmdb } from '@/lib/tmdb';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Flame, Heart, Skull, Ghost, Laugh, Rocket, 
  Sword, Music, Users, Baby, Search, Sparkles, Film
} from 'lucide-react';

interface GenreFilterProps {
  mediaType: 'movie' | 'tv';
  selectedGenre: number | null;
  onGenreSelect: (genreId: number | null) => void;
}

// Genre icons mapping
const genreIcons: Record<number, React.ReactNode> = {
  28: <Sword className="h-3.5 w-3.5" strokeWidth={2.5} />,      // Action
  12: <Rocket className="h-3.5 w-3.5" strokeWidth={2.5} />,     // Adventure
  16: <Baby className="h-3.5 w-3.5" strokeWidth={2.5} />,       // Animation
  35: <Laugh className="h-3.5 w-3.5" strokeWidth={2.5} />,      // Comedy
  80: <Skull className="h-3.5 w-3.5" strokeWidth={2.5} />,      // Crime
  99: <Film className="h-3.5 w-3.5" strokeWidth={2.5} />,       // Documentary
  18: <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />,      // Drama
  10751: <Users className="h-3.5 w-3.5" strokeWidth={2.5} />,   // Family
  14: <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />,   // Fantasy
  36: <Search className="h-3.5 w-3.5" strokeWidth={2.5} />,     // History
  27: <Ghost className="h-3.5 w-3.5" strokeWidth={2.5} />,      // Horror
  10402: <Music className="h-3.5 w-3.5" strokeWidth={2.5} />,   // Music
  9648: <Search className="h-3.5 w-3.5" strokeWidth={2.5} />,   // Mystery
  10749: <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />,   // Romance
  878: <Rocket className="h-3.5 w-3.5" strokeWidth={2.5} />,    // Sci-Fi
  53: <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />,      // Thriller
  10752: <Sword className="h-3.5 w-3.5" strokeWidth={2.5} />,   // War
  37: <Sword className="h-3.5 w-3.5" strokeWidth={2.5} />,      // Western
};

export const GenreFilter = ({ mediaType, selectedGenre, onGenreSelect }: GenreFilterProps) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      try {
        const data = await tmdb.getGenres(mediaType);
        setGenres(data.genres || []);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, [mediaType]);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-scroll scrollbar-hide px-3 sm:px-4 lg:px-8 py-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-24 h-10 bg-muted border-2 border-foreground shimmer" 
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Scrollable genre pills - Brutalist */}
      <div className="flex gap-2 sm:gap-3 overflow-x-scroll scrollbar-hide px-3 sm:px-4 lg:px-8">
        {/* All button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onGenreSelect(null)}
          className={cn(
            "flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wide transition-all duration-100 flex items-center gap-2 border-2 border-foreground",
            selectedGenre === null
              ? "bg-primary text-primary-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]"
              : "bg-background text-foreground hover:bg-muted shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          )}
        >
          <Film className="h-3.5 w-3.5" strokeWidth={2.5} />
          ALL
        </motion.button>

        {/* Genre pills */}
        {genres.map((genre) => (
          <motion.button
            key={genre.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onGenreSelect(selectedGenre === genre.id ? null : genre.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wide transition-all duration-100 flex items-center gap-2 whitespace-nowrap border-2 border-foreground",
              selectedGenre === genre.id
                ? "bg-primary text-primary-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]"
                : "bg-background text-foreground hover:bg-muted shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            )}
          >
            {genreIcons[genre.id] || <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />}
            {genre.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default GenreFilter;
