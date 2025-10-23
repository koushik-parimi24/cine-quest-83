import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { watchLaterService } from '@/lib/watchLater';
import { Movie } from '@/types/movie';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { Bookmark } from 'lucide-react';

const WatchLater = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    loadWatchLater();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadWatchLater();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadWatchLater = () => {
    setMovies(watchLaterService.getAll());
  };

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}&type=movie`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="container mx-auto px-4 lg:px-8 pt-32 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Bookmark className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Watch Later</h1>
        </div>

        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                mediaType={movie.media_type || 'movie'} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">
              Your watch later list is empty
            </p>
            <p className="text-muted-foreground mt-2">
              Start adding movies and TV shows you want to watch!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchLater;
