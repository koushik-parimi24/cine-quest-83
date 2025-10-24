import { useEffect, useState } from 'react';
import { tmdb } from '@/lib/tmdb';
import { Movie, MediaType } from '@/types/movie';
import { Hero } from '@/components/Hero';
import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { watchHistory, HistoryEntry } from '@/lib/watchHistory';
import ContinueWatching from '@/components/ContinueWatching';
import Recommendations from '@/components/Recommendations';

const Home = () => {
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Continue watching and recommendations
  const [continueWatching, setContinueWatching] = useState<HistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<(Movie & { mediaType?: 'movie' | 'tv' })[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    loadContent();
  }, [mediaType]);

  // Auto-rotate hero section every ~6 seconds
  useEffect(() => {
    if (trending.length === 0) return;
    
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(trending.length, 5));
    }, 6000);

    return () => clearInterval(interval);
  }, [trending]);

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
      
      // Set hero movie from trending - start with first
      if (trendingRes.results && trendingRes.results.length > 0) {
        setHeroMovie(trendingRes.results[0]);
        setHeroIndex(0);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load continue-watching from localStorage and listen for storage events
  useEffect(() => {
    setContinueWatching(watchHistory.getAll());
    const onStorage = () => setContinueWatching(watchHistory.getAll());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Build simple recommendations based on up to 3 most recent watched items
  useEffect(() => {
    if (continueWatching.length === 0) {
      setRecommendations([]);
      return;
    }

    let mounted = true;
    const fetchRecs = async () => {
      setLoadingRecs(true);
      try {
        const idsToExclude = new Set(continueWatching.map(c => c.id));
        const recMap = new Map<number, any>();
        const recent = continueWatching.slice(0, 3);

        for (const entry of recent) {
          const res = await tmdb.getSimilar(entry.id, entry.mediaType);
          const items = res.results || [];
          for (const it of items) {
            if (idsToExclude.has(it.id)) continue;
            if (!recMap.has(it.id)) recMap.set(it.id, { ...it, mediaType: entry.mediaType });
          }
        }

        if (mounted) setRecommendations(Array.from(recMap.values()).slice(0, 12));
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        if (mounted) setLoadingRecs(false);
      }
    };

    fetchRecs();
    return () => { mounted = false; };
  }, [continueWatching]);

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

      {/* Hero Section with rotation */}
      <div className="pt-16">
        {trending.length > 0 && (
          <Hero
            movie={trending[heroIndex]}
            mediaType={mediaType}
          />
        )}

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <ContinueWatching items={continueWatching} />
          </div>
        )}

        {/* Recommendations based on recent watching */}
        {recommendations.length > 0 && (
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <Recommendations movies={recommendations} />
          </div>
        )}
      </div>

      {/* Media Type Toggle */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            onClick={() => setMediaType('movie')}
            variant={mediaType === 'movie' ? 'default' : 'outline'}
            className={mediaType === 'movie' ? 'bg-[var(--gradient-primary)] shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-glow-bright)] transition-all hover:scale-105' : 'touch-manipulation'}
          >
            Movies
          </Button>
          <Button
            onClick={() => setMediaType('tv')}
            variant={mediaType === 'tv' ? 'default' : 'outline'}
            className={mediaType === 'tv' ? 'bg-[var(--gradient-primary)] shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-glow-bright)] transition-all hover:scale-105' : 'touch-manipulation'}
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
