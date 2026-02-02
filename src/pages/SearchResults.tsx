import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tmdb } from '@/lib/tmdb';
import { Movie, MediaType } from '@/types/movie';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

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
        {/* Header - Brutalist */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="p-2 bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight">
              RESULTS FOR "{query.toUpperCase()}"
            </h1>
          </div>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-xs sm:text-sm font-bold uppercase">
            {results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'} FOUND
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="p-4 bg-primary border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]" style={{ borderWidth: '3px' }}>
              <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
            </div>
          </div>
        ) : results.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6 pt-4 pb-8"
          >
            {results.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <MovieCard movie={movie} mediaType={type} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-block p-4 bg-muted border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] mb-6" style={{ borderWidth: '3px' }}>
              <Search className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-lg sm:text-xl font-black uppercase text-muted-foreground">
              NO RESULTS FOUND
            </p>
            <p className="text-sm text-muted-foreground uppercase mt-2">
              TRY A DIFFERENT SEARCH TERM
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
