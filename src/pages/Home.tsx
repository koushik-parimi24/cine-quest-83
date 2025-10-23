import { useEffect, useState } from 'react';
import { tmdb } from '@/lib/tmdb';
import { Movie, MediaType } from '@/types/movie';
import { Hero } from '@/components/Hero';
import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [mediaType]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [trendingRes, popularRes, topRatedRes] = await Promise.all([
        tmdb.getTrending(mediaType),
        tmdb.getPopular(mediaType),
        tmdb.getTopRated(mediaType),
      ]);

      setTrending(trendingRes.results || []);
      setPopular(popularRes.results || []);
      setTopRated(topRatedRes.results || []);
      
      // Set hero movie from trending
      if (trendingRes.results && trendingRes.results.length > 0) {
        setHeroMovie(trendingRes.results[0]);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}&type=${mediaType}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      {/* Hero Section */}
      <div className="pt-16">
        {heroMovie && <Hero movie={heroMovie} mediaType={mediaType} />}
      </div>

      {/* Media Type Toggle */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => setMediaType('movie')}
            variant={mediaType === 'movie' ? 'default' : 'outline'}
            className={mediaType === 'movie' ? 'bg-[var(--gradient-primary)]' : ''}
          >
            Movies
          </Button>
          <Button
            onClick={() => setMediaType('tv')}
            variant={mediaType === 'tv' ? 'default' : 'outline'}
            className={mediaType === 'tv' ? 'bg-[var(--gradient-primary)]' : ''}
          >
            TV Shows
          </Button>
        </div>

        {/* Content Rows */}
        <div className="space-y-8">
          <MovieRow 
            title={`Trending ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`} 
            movies={trending} 
            mediaType={mediaType}
          />
          <MovieRow 
            title={`Popular ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`} 
            movies={popular} 
            mediaType={mediaType}
          />
          <MovieRow 
            title={`Top Rated ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`} 
            movies={topRated} 
            mediaType={mediaType}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
