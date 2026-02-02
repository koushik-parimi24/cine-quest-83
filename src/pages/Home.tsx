import { useEffect, useState } from 'react';
import { tmdb } from '@/lib/tmdb';
import { Movie, MediaType } from '@/types/movie';
import { HeroCarousel } from '@/components/HeroCarousel';
import { MovieRow } from '@/components/MovieRow';
import { TopTenRow } from '@/components/TopTenRow';
import { GenreFilter } from '@/components/GenreFilter';
import { SkeletonRow } from '@/components/SkeletonRow';
import { Navbar } from '@/components/Navbar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { watchHistory, HistoryEntry } from '@/lib/watchHistory';
import ContinueWatching from '@/components/ContinueWatching';
import Recommendations from '@/components/Recommendations';
import BecauseYouWatched from '@/components/BecauseYouWatched';
import ComingSoon from '@/components/ComingSoon';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type') as MediaType | null;
  const [mediaType, setMediaType] = useState<MediaType>(urlType || 'movie');
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [loadingGenre, setLoadingGenre] = useState(false);

  const [continueWatching, setContinueWatching] = useState<HistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<(Movie & { mediaType?: 'movie' | 'tv' })[]>([]);

  // Sync mediaType with URL params
  useEffect(() => {
    if (urlType && (urlType === 'movie' || urlType === 'tv')) {
      setMediaType(urlType);
    }
  }, [urlType]);

  useEffect(() => {
    loadContent();
  }, [mediaType]);

  useEffect(() => {
    if (selectedGenre) {
      loadGenreContent();
    } else {
      setGenreMovies([]);
    }
  }, [selectedGenre, mediaType]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [trendingRes, popularRes, topRatedRes, upcomingRes] = await Promise.all([
        tmdb.getTrending(mediaType),
        tmdb.getPopular(mediaType),
        tmdb.getTopRated(mediaType),
        tmdb.getUpcoming(), // Only for movies
      ]);

      setTrending(trendingRes.results || []);
      setPopular(popularRes.results || []);
      setTopRated(topRatedRes.results || []);
      setUpcoming(upcomingRes.results || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGenreContent = async () => {
    if (!selectedGenre) return;
    
    setLoadingGenre(true);
    try {
      const res = await tmdb.discover(mediaType, {
        with_genres: selectedGenre.toString(),
        sort_by: 'popularity.desc',
      });
      setGenreMovies(res.results || []);
    } catch (error) {
      console.error('Error loading genre content:', error);
    } finally {
      setLoadingGenre(false);
    }
  };

  useEffect(() => {
    setContinueWatching(watchHistory.getAll());
    const onStorage = () => setContinueWatching(watchHistory.getAll());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (continueWatching.length === 0) {
      setRecommendations([]);
      return;
    }

    let mounted = true;
    const fetchRecs = async () => {
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
      }
    };

    fetchRecs();
    return () => { mounted = false; };
  }, [continueWatching]);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearch={handleSearch} />
        <div className="pt-16">
          {/* Hero skeleton - Brutalist */}
          <div className="h-[70vh] bg-muted border-b-3 border-foreground shimmer" style={{ borderBottomWidth: '3px' }} />
          
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-8 space-y-8">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="pt-16">
        {/* Hero Carousel */}
        {trending.length > 0 && (
          <HeroCarousel
            movies={trending}
            mediaType={mediaType}
          />
        )}

        {/* Genre Filter */}
        <div className="relative -mt-12 z-20 bg-background border-t-3 border-foreground" style={{ borderTopWidth: '3px' }}>
          <GenreFilter
            mediaType={mediaType}
            selectedGenre={selectedGenre}
            onGenreSelect={setSelectedGenre}
          />
        </div>

        {/* Genre-specific content */}
        {selectedGenre && (
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            {loadingGenre ? (
              <SkeletonRow title={true} count={6} />
            ) : genreMovies.length > 0 ? (
              <MovieRow 
                title="FILTERED RESULTS" 
                movies={genreMovies} 
                mediaType={mediaType}
              />
            ) : null}
          </div>
        )}

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <ContinueWatching items={continueWatching} />
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <Recommendations movies={recommendations} />
          </div>
        )}

        {/* Because You Watched - Personalized sections */}
        {continueWatching.length > 0 && (
          <div className="py-6 sm:py-8">
            {continueWatching.slice(0, 2).map((item) => (
              <BecauseYouWatched key={`byw-${item.id}`} historyItem={item} />
            ))}
          </div>
        )}

        {/* Coming Soon - Upcoming releases */}
        {upcoming.length > 0 && mediaType === 'movie' && (
          <div className="py-6 sm:py-8">
            <ComingSoon movies={upcoming} mediaType={mediaType} />
          </div>
        )}
      </div>

      {/* Media Type Toggle - Brutalist */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-8 ml-5">
          <button
            onClick={() => setMediaType('movie')}
            className={`px-6 py-3 font-black text-sm uppercase tracking-wide border-3 border-foreground transition-all duration-100 ${
              mediaType === 'movie' 
                ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]' 
                : 'bg-background text-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
            style={{ borderWidth: '3px' }}
          >
            MOVIES
          </button>
          <button
            onClick={() => setMediaType('tv')}
            className={`px-6 py-3 font-black text-sm uppercase tracking-wide border-3 border-foreground transition-all duration-100 ${
              mediaType === 'tv' 
                ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]' 
                : 'bg-background text-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
            style={{ borderWidth: '3px' }}
          >
            TV SHOWS
          </button>
        </div>

        {/* Content Rows */}
        <div className="space-y-10">
          {/* Top 10 Trending */}
          <TopTenRow 
            title={`${mediaType === 'movie' ? 'MOVIES' : 'TV SHOWS'} TODAY`}
            movies={trending} 
            mediaType={mediaType}
          />

          <MovieRow 
            title={`TRENDING ${mediaType === 'movie' ? 'MOVIES' : 'TV SHOWS'}`} 
            movies={trending} 
            mediaType={mediaType}
          />
          <MovieRow 
            title={`POPULAR ${mediaType === 'movie' ? 'MOVIES' : 'TV SHOWS'}`} 
            movies={popular} 
            mediaType={mediaType}
          />
          <MovieRow 
            title={`TOP RATED ${mediaType === 'movie' ? 'MOVIES' : 'TV SHOWS'}`} 
            movies={topRated} 
            mediaType={mediaType}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
