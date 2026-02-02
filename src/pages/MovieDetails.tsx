import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb, getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import { MovieDetails as MovieDetailsType, Credits, Video, Review, MediaType } from '@/types/movie';
import { Navbar } from '@/components/Navbar';
import { MovieRow } from '@/components/MovieRow';
import { Play, Plus, Check, ArrowLeft, DollarSign, Calendar, Clock, Star, ExternalLink, X } from 'lucide-react';
import { watchHistory } from '@/lib/watchHistory';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { supabase } from '@/lib/supabaseClient';
import { ShareButton } from "../components/ShareMenu";
import { motion } from 'framer-motion';

const MovieDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const mediaType = type as MediaType;
  const [details, setDetails] = useState<MovieDetailsType | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, watchlist, add, remove } = useWatchlist();
  
  const isInWatchLater = useMemo(
    () => watchlist.some(item => item.media_id === parseInt(id!)),
    [watchlist, id]
  );
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedServer, setSelectedServer] = useState('server1');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id, mediaType]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [detailsRes, creditsRes, videosRes, reviewsRes, similarRes] = await Promise.all([
        tmdb.getDetails(parseInt(id!), mediaType),
        tmdb.getCredits(parseInt(id!), mediaType),
        tmdb.getVideos(parseInt(id!), mediaType),
        tmdb.getReviews(parseInt(id!), mediaType),
        tmdb.getSimilar(parseInt(id!), mediaType),
      ]);

      setDetails(detailsRes);
      setCredits(creditsRes);
      setVideos(videosRes.results || []);
      setReviews(reviewsRes.results || []);
      setSimilar(similarRes.results || []);
      
      if (mediaType === 'tv' && detailsRes?.seasons?.length) {
        const firstRealSeason = detailsRes.seasons.find((s: any) => s.season_number > 0);
        if (firstRealSeason) {
          setSelectedSeason(firstRealSeason.season_number);
        }
      }
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mediaType === 'tv' && id && details && selectedSeason) {
      const fetchSeasonData = async () => {
        setLoadingSeason(true);
        try {
          const seasonResponse = await fetch(
            `https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}`,
            {
              headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZWJiYjQwMTA5ZDBmZDYyYjI3OTY3MGE2MDU4NDA2MyIsIm5iZiI6MTc1MTY5NTcwOC43NzIsInN1YiI6IjY4NjhjMTVjYzhlYzE3NDVhM2NlZGM1OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.t_nlKGADApnBaOxU2sdH8eSQK9JR8qanrBulfD8rUEE'
              }
            }
          );
          const seasonData = await seasonResponse.json();
          setSeasonData(seasonData);
          setSelectedEpisode(1);
        } catch (error) {
          console.error('Failed to load season data:', error);
        } finally {
          setLoadingSeason(false);
        }
      };
      fetchSeasonData();
    }
  }, [id, mediaType, details, selectedSeason]);

  const handleWatchLater = async () => {
    if (!user) {
      toast.error('Please login to add to watchlist', {
        action: {
          label: 'Login',
          onClick: async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.href },
            });
          },
        },
      });
      return;
    }
    
    if (!details || !id) return;
    
    const movieId = parseInt(id);
    if (isNaN(movieId)) {
      toast.error('Unable to add - invalid movie ID');
      return;
    }
    
    try {
      if (isInWatchLater) {
        await remove(movieId);
        toast.success('Removed from Watch Later');
      } else {
        await add({
          media_id: movieId,
          media_type: mediaType,
          title: details.title || details.name,
          original_title: details.title,
          original_name: details.name,
          poster_path: details.poster_path || undefined,
          release_date: details.release_date,
          first_air_date: details.first_air_date,
          vote_average: details.vote_average,
        });
        toast.success('Added to Watch Later');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update watchlist');
    }
  };

  const streamingServers = {
    server1: {
      name: 'SERVER 1',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=63b8bc&secondaryColor=a2a2a2&iconColor=eefdec&icons=default&player=default&title=true&poster=true&autoplay=true&nextbutton=true`
          : `https://vidlink.pro/movie/${tmdbId}`,
      quality: 'HD',
    },
    server2: {
      name: 'SERVER 2',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://moviesapi.club/tv/${tmdbId}/${season}/${episode}`
          : `https://moviesapi.club/movie/${tmdbId}?overlay=true`,
      quality: 'HD',
    },
    server3: {
      name: 'SERVER 3',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`
          : `https://player.videasy.net/movie/${tmdbId}?overlay=true`,
      quality: 'HD',
    },
    server4: {
      name: 'SERVER 4',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
          : `https://vidsrc.me/embed/movie/${tmdbId}`,
      quality: 'HD+',
    },
    server5: {
      name: 'SERVER 5',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://www.2embed.cc/embedtv/${tmdbId}/${season}/${episode}`
          : `https://www.2embed.cc/embed/${tmdbId}`,
      quality: 'HD',
    },
  };

  const getCurrentStreamUrl = () => {
    const server = streamingServers[selectedServer as keyof typeof streamingServers];
    return server.url(id!, mediaType, selectedSeason, selectedEpisode);
  };

  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const addToHistory = (progress?: number) => {
    if (!details) return;
    try {
      const safeDetails = {
        ...details,
        vote_average: details.vote_average ?? 0,
        vote_count: details.vote_count ?? 0,
        title: details.title || details.name || "Untitled",
      };
      watchHistory.add(safeDetails as any, mediaType, progress);
    } catch (e) {
      console.warn("Failed to write watch history", e);
    }
  };

  useEffect(() => {
    if (!showPlayer) return;
    try {
      const url = getCurrentStreamUrl();
      setStreamUrl(url);
    } catch (e) {
      setStreamUrl(null);
    }
  }, [selectedServer, selectedSeason, selectedEpisode, id, mediaType, showPlayer]);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}&type=${mediaType}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="p-4 bg-primary border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]" style={{ borderWidth: '3px' }}>
          <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
        </div>
      </div>
    );
  }

  if (!details) return null;

  const title = details.title || details.name || '';
  const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const director = credits?.crew.find(c => c.job === 'Director');
  const producers = credits?.crew.filter(c => c.job === 'Producer').slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      {/* Hero Section */}
      <div className="relative pt-16">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${getBackdropUrl(details.backdrop_path)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />

        <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
          {/* Back Button - Brutalist */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="mb-4 mt-2 sm:mt-4 p-2 sm:p-3 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
            <span className="text-xs sm:text-sm font-black uppercase">BACK</span>
          </motion.button>

          <div className="grid lg:grid-cols-[280px,1fr] gap-6 lg:gap-8 items-start">
            {/* Poster - Brutalist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <img
                src={getImageUrl(details.poster_path)}
                alt={title}
                className="w-full max-w-[280px] mx-auto lg:mx-0 border-3 border-foreground shadow-[6px_6px_0px_hsl(var(--foreground))]"
                style={{ borderWidth: '3px' }}
              />
            </motion.div>

            {/* Details */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Title - Brutalist */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tight">
                {title}
              </h1>
              
              {details.tagline && (
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-bold uppercase tracking-wide">
                  "{details.tagline}"
                </p>
              )}

              {/* Meta Info - Brutalist Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 font-black text-xs sm:text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  <Star className="inline h-3 w-3 mr-1 fill-current" />
                  {details.vote_average.toFixed(1)}
                </span>
                {details.release_date && (
                  <span className="bg-secondary text-secondary-foreground px-2 sm:px-3 py-1 sm:py-1.5 font-black text-xs sm:text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {new Date(details.release_date).getFullYear()}
                  </span>
                )}
                {details.runtime && (
                  <span className="bg-accent text-accent-foreground px-2 sm:px-3 py-1 sm:py-1.5 font-black text-xs sm:text-sm uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {Math.floor(details.runtime / 60)}H {details.runtime % 60}M
                  </span>
                )}
              </div>

              {/* Genres - Brutalist */}
              <div className="flex flex-wrap gap-2">
                {details.genres.map(genre => (
                  <span 
                    key={genre.id} 
                    className="px-2 sm:px-3 py-1 bg-muted text-foreground text-xs font-black uppercase border-2 border-foreground"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Overview */}
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase mb-2">OVERVIEW</h2>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">{details.overview}</p>
              </div>

              {/* Financial Info - Brutalist */}
              {(details.budget || details.revenue) && (
                <div className="flex flex-wrap gap-4">
                  {details.budget && details.budget > 0 && (
                    <div className="bg-card p-3 border-2 border-foreground">
                      <h3 className="text-xs text-muted-foreground font-bold uppercase mb-1">BUDGET</h3>
                      <p className="flex items-center gap-1 text-lg font-black">
                        <DollarSign className="h-4 w-4" />
                        {(details.budget / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                  {details.revenue && details.revenue > 0 && (
                    <div className="bg-card p-3 border-2 border-foreground">
                      <h3 className="text-xs text-muted-foreground font-bold uppercase mb-1">REVENUE</h3>
                      <p className="flex items-center gap-1 text-lg font-black text-primary">
                        <DollarSign className="h-4 w-4" />
                        {(details.revenue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons - Brutalist */}
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
                <button
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground font-black text-xs sm:text-sm uppercase border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 flex items-center gap-2"
                  onClick={() => { if (!showPlayer) { try { addToHistory(); } catch {} } setShowPlayer(!showPlayer); }}
                >
                  <Play className="h-4 w-4 fill-current" />
                  WATCH NOW
                </button>
                {trailer && (
                  <button
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-secondary text-secondary-foreground font-black text-xs sm:text-sm uppercase border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 flex items-center gap-2"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                  >
                    <Play className="h-4 w-4" />
                    TRAILER
                  </button>
                )}
                <button
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-accent text-accent-foreground font-black text-xs sm:text-sm uppercase border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 flex items-center gap-2"
                  onClick={handleWatchLater}
                >
                  {isInWatchLater ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={3} />}
                  {isInWatchLater ? 'SAVED' : 'SAVE'}
                </button>
                <ShareButton
                  title={details.title || details.name}
                  text={`Watch ${details.title || details.name} on CinemaHub!`}
                  mediaType={mediaType}
                  id={id!}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Server & Episode Selection - Brutalist */}
      {showPlayer && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8"
        >
          <div className="bg-card border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]" style={{ borderWidth: '3px' }}>
            {/* Server Selection */}
            <div className="p-4 sm:p-6 border-b-2 border-foreground">
              <h3 className="text-lg font-black uppercase mb-4">SELECT SERVER</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {Object.entries(streamingServers).map(([key, server]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedServer(key);
                      try { addToHistory(); } catch {}
                    }}
                    className={`p-3 border-2 border-foreground font-black text-xs uppercase transition-all duration-100 ${
                      selectedServer === key 
                        ? 'bg-primary text-primary-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]' 
                        : 'bg-background hover:bg-muted shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="mb-1">{server.name}</div>
                      <div className="text-[10px] opacity-70">{server.quality}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Season & Episode Selection for TV Shows */}
            {mediaType === 'tv' && details?.seasons && (
              <div className="p-4 sm:p-6 border-b-2 border-foreground">
                <h3 className="text-lg font-black uppercase mb-4">SELECT EPISODE</h3>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {/* Season Selector */}
                  <div>
                    <label className="text-xs font-black text-muted-foreground mb-2 block uppercase">SEASON</label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-background border-3 border-foreground text-sm font-bold uppercase focus:outline-none focus:shadow-[4px_4px_0px_hsl(var(--primary))]"
                      style={{ borderWidth: '3px' }}
                    >
                      {details.seasons
                        .filter((s: any) => s.season_number > 0)
                        .map((season: any) => (
                          <option key={season.id} value={season.season_number}>
                            SEASON {season.season_number} ({season.episode_count} EPS)
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Episode Selector */}
                  <div>
                    <label className="text-xs font-black text-muted-foreground mb-2 block uppercase">EPISODE</label>
                    <select
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
                      disabled={loadingSeason}
                      className="w-full px-4 py-3 bg-background border-3 border-foreground text-sm font-bold uppercase focus:outline-none focus:shadow-[4px_4px_0px_hsl(var(--primary))] disabled:opacity-50"
                      style={{ borderWidth: '3px' }}
                    >
                      {seasonData?.episodes ? (
                        seasonData.episodes.map((ep: any) => (
                          <option key={ep.id} value={ep.episode_number}>
                            EP {ep.episode_number}: {ep.name}
                          </option>
                        ))
                      ) : (
                        <option value={1}>EPISODE 1</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Player */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase">PLAYER</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { try { addToHistory(); } catch {} window.open(getCurrentStreamUrl(), '_blank'); }}
                    className="px-3 py-2 bg-secondary text-secondary-foreground text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    NEW TAB
                  </button>
                  <button 
                    onClick={() => setShowPlayer(false)}
                    className="p-2 bg-destructive text-destructive-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                  >
                    <X className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </div>
              {streamUrl ? (
                <div className="w-full aspect-video bg-black border-2 border-foreground overflow-hidden">
                  <iframe
                    title="Player"
                    src={streamUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-6 bg-muted border-2 border-foreground text-center">
                  <p className="mb-3 font-bold">PLAYER UNAVAILABLE FOR THIS SERVER</p>
                  <button 
                    onClick={() => { try { addToHistory(); } catch {} window.open(getCurrentStreamUrl(), '_blank'); }}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                  >
                    OPEN IN NEW TAB
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Cast & Crew - Brutalist */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-black uppercase">CAST & CREW</h2>
          <div className="h-1 w-16 sm:w-24 bg-primary" />
        </div>
        
        {director && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-black text-muted-foreground uppercase mb-1">DIRECTOR</h3>
            <p className="text-lg sm:text-xl font-black">{director.name}</p>
          </div>
        )}

        {producers.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-black text-muted-foreground uppercase mb-1">PRODUCERS</h3>
            <p className="text-base sm:text-lg font-bold">{producers.map(p => p.name).join(', ')}</p>
          </div>
        )}

        <h3 className="text-xs sm:text-sm font-black text-muted-foreground uppercase mb-4">CAST</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {credits?.cast.slice(0, 12).map(actor => (
            <div key={actor.id} className="text-center">
              <div className="border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] overflow-hidden mb-2">
                <img
                  src={getImageUrl(actor.profile_path, 'w200')}
                  alt={actor.name}
                  className="w-full aspect-square object-cover"
                />
              </div>
              <p className="font-black text-xs uppercase truncate">{actor.name}</p>
              <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews - Brutalist */}
      {reviews.length > 0 && (
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-black uppercase">REVIEWS</h2>
            <div className="h-1 w-16 sm:w-24 bg-secondary" />
          </div>
          <div className="space-y-4">
            {reviews.slice(0, 10).map(review => (
              <div key={review.id} className="bg-card p-4 sm:p-6 border-3 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]" style={{ borderWidth: '3px' }}>
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary flex items-center justify-center text-lg sm:text-xl text-primary-foreground font-black border-2 border-foreground">
                    {review.author[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase">{review.author}</p>
                    {review.author_details.rating && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="font-bold">{review.author_details.rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground/90 line-clamp-4">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar - uses MovieRow which is already brutalist */}
      {similar.length > 0 && (
        <div className="py-8 sm:py-12">
          <MovieRow 
            title="SIMILAR TITLES" 
            movies={similar} 
            mediaType={mediaType}
          />
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
