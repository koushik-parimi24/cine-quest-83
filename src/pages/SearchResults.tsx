import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tmdb } from '@/lib/tmdb';
import { Movie, MediaType } from '@/types/movie';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { Loader2 } from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'movie') as MediaType;
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      searchMovies();
    }
  }, [query, type]);

  const searchMovies = async () => {
    setLoading(true);
    try {
      const response = await tmdb.search(query, type);
      setResults(response.results || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}&type=${type}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 sm:pt-32 pb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
          {results.length} {results.length === 1 ? 'result' : 'results'} found
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} mediaType={type} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg sm:text-xl text-muted-foreground">
              No results found. Try a different search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
