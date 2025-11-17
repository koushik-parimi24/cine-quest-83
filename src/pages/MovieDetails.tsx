import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb, getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import { MovieDetails as MovieDetailsType, Credits, Video, Review, MediaType } from '@/types/movie';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MovieRow } from '@/components/MovieRow';
import { Play, Plus, Check, ArrowLeft, DollarSign, Calendar, Clock, Star } from 'lucide-react';
import { watchHistory } from '@/lib/watchHistory';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { supabase } from '@/lib/supabaseClient';
import { ShareButton } from "../components/ShareMenu";

// Define the Vidfast origins
const vidfastOrigins = [
    'https://vidfast.pro',
    'https://vidfast.in',
    'https://vidfast.io',
    'https://vidfast.me',
    'https://vidfast.net',
    'https://vidfast.pm',
    'https://vidfast.xyz'
];

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
      
      // Set initial season for TV shows
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

  // Fetch season data for TV shows
  useEffect(() => {
    if (mediaType === 'tv' && id && details && selectedSeason) {
      const fetchSeasonData = async () => {
        setLoadingSeason(true);
        try {
          const response = await tmdb.getDetails(parseInt(id), 'tv');
          // Fetch specific season details
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
      console.error('Invalid movie ID:', id);
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
      console.error('Watchlist error:', error);
      toast.error(error?.message || 'Failed to update watchlist');
    }
  };

  const streamingServers = {
    server1: {
      name: 'server1',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=63b8bc&secondaryColor=a2a2a2&iconColor=eefdec&icons=default&player=default&title=true&poster=true&autoplay=true&nextbutton=true`
          : `https://vidlink.pro/movie/${tmdbId}`,
      quality: 'HD',
    },
    server2: {
  name: 'server 2',
  url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
    mediaType === 'tv'
      ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true&title=true&poster=true&theme=16A085&nextButton=true&autoNext=true`
      : `https://vidfast.pro/movie/${tmdbId}?autoPlay=true`,
  quality: 'HD',
},
server3: {
  name: 'server3',
  url: (
    tmdbId: string,
    mediaType: string,
    season?: number,
    episode?: number,
    anilist_id?: string
  ) => {
    if (mediaType === 'tv') {
      return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`;
    } else if (mediaType === 'anime' && anilist_id) {
      return `https://player.videasy.net/anime/${anilist_id}/episode?dub=true`;
    } else {
      return `https://player.videasy.net/movie/${tmdbId}?overlay=true`;
    }
  },
  quality: 'HD',
},
    server4: {
      name: 'server4',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}`
          : `https://player.vidzee.wtf/embed/movie/${tmdbId}`,
      quality: 'HD+',
    },
    server5: {
      name: 'server5',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://vidrock.net/embed/tv/${id}/${season}/${episode}`
          : `https://vidrock.net/embed/movie/${tmdbId}`,
      quality: 'HD+',
    },
    serve6: {
      name: 'server6',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`
          : `https://player.smashy.stream/movie/${tmdbId}`,
      quality: 'HD+',
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
    // Ensure the movie object includes all rating data
    const safeDetails = {
      ...details,
      vote_average: details.vote_average ?? 0,
      vote_count: details.vote_count ?? 0,
      title: details.title || details.name || "Untitled",
    };

    // Log once for debugging
    console.log("Saving history:", {
      title: safeDetails.title,
      rating: safeDetails.vote_average,
      type: mediaType,
    });

    watchHistory.add(safeDetails as any, mediaType, progress);
  } catch (e) {
    console.warn("Failed to write watch history", e);
  }
};


  // update streamUrl when selection changes
  useEffect(() => {
    if (!showPlayer) return;
    try {
      const url = getCurrentStreamUrl();
      setStreamUrl(url);
    } catch (e) {
      setStreamUrl(null);
    }
  }, [selectedServer, selectedSeason, selectedEpisode, id, mediaType, showPlayer]);

  // *** ADDED THIS USEEFFECT ***
  // Listen for messages from Vidfast player
  useEffect(() => {
    const handlePlayerMessage = ({ origin, data }: MessageEvent) => {
        // Check if the message is from a valid Vidfast origin
        if (!vidfastOrigins.includes(origin) || !data) {
            return;
        }
    
        // Check if it's a player event
        if (data.type === 'PLAYER_EVENT') {
            const { event, currentTime, duration } = data.data;
    
            // Log the event as requested
            console.log(`Player ${event} at ${currentTime}s of ${duration}s`);

        }
    };

    // Add the event listener
    window.addEventListener('message', handlePlayerMessage);

    // Return a cleanup function to remove the listener on unmount
    return () => {
        window.removeEventListener('message', handlePlayerMessage);
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount
  // *** END OF ADDED USEEFFECT ***

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}&type=${mediaType}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        <div className="relative z-10 container mx-auto px-4 lg:px-8 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-3 mt-4 bg-red-300 text-black rounded-full"

          >
            <ArrowLeft className="h-4 w-4 " />
          </Button>

          <div className="grid lg:grid-cols-[258px,1fr] gap-8 items-start">
            {/* Poster */}
            <img
              src={getImageUrl(details.poster_path)}
              alt={title}
              className="rounded-lg shadow-2xl   "
            />

            {/* Details */}
            <div className="space-y-3 animate-fade-in">
              <h1 className="text-2xl  lg:text-5xl md:text-3xl font-black">{title}</h1>
              
              {details.tagline && (
                <p className="text-sm md:text-xl lg:text-3xl text-muted-foreground italic">{details.tagline}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm ">
                <div className="flex items-center gap-2">
                  <Star className="h-3 md:h-5 lg:h-5 w-5 text-accent fill-accent" />
                  <span className="text-xs font-bold">{details.vote_average.toFixed(1)}</span>
                  <span className="text-muted-foreground">({details.vote_count} votes)</span>
                </div>
                {details.release_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(details.release_date).getFullYear()}</span>
                  </div>
                )}
                {details.runtime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {details.genres.map(genre => (
                  <span key={genre.id} className="px-3 py-1 rounded-full bg-secondary text-sm">
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Overview */}
              <div>
                <h2 className="text-xl font-bold mb-2">Overview</h2>
                <p className="text-foreground/90 leading-relaxed">{details.overview}</p>
              </div>

              {/* Financial Info */}
              {(details.budget || details.revenue) && (
                <div className="grid grid-cols-2 gap-4">
                  {details.budget && details.budget > 0 && (
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">Budget</h3>
                      <p className="flex items-center gap-1 text-lg font-bold">
                        <DollarSign className="h-4 w-4" />
                        {(details.budget / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                  {details.revenue && details.revenue > 0 && (
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">Revenue</h3>
                      <p className="flex items-center gap-1 text-lg font-bold">
                        <DollarSign className="h-4 w-4" />
                        {(details.revenue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[var(--shadow-glow-bright)] transition-all hover:scale-105 touch-manipulation font-bold"
                  onClick={() => { if (!showPlayer) { try { addToHistory(); } catch {} } setShowPlayer(!showPlayer); }}
                >
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  Watch Now
                </Button>
                {trailer && (
                  <Button
                    size="lg"
                    className="bg-primary hover:shadow-[var(--shadow-glow)] transition-all hover:scale-105 touch-manipulation"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                  >
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Watch Trailer
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent/50 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover:scale-105 touch-manipulation"
                  onClick={handleWatchLater}
                >
                  {isInWatchLater ? <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> : <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
                  {isInWatchLater ? 'In Watch Later' : 'Add to Watch Later'}
                </Button>

                <ShareButton
                title={details.title || details.name}
                text={`Watch ${details.title || details.name} on CinemaHub!`}
                mediaType={mediaType}
                id={id!}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Server & Episode Selection Section */}
      {showPlayer && (
        <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Server Selection */}
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold mb-4">Choose Streaming Server</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(streamingServers).map(([key, server]) => (
                  <button
                    key={key}
                    onClick={() => {
                      // set the server and load in-page player (iframe)
                      setSelectedServer(key);
                      // record to continue-watching history
                      try { addToHistory(); } catch {}
                      // ensure player area is shown
                      setShowPlayer(true);
                    }}
                    className={
                      `p-4 rounded-lg border-2 transition-all hover:scale-105 bg-secondary hover:bg-secondary/80 border-border hover:border-primary group " +
                      (selectedServer === key ? ' ring-2 ring-primary' : '')`
                    }
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1 group-hover:text-primary">{server.name}</div>
                      <div className="text-xs text-muted-foreground">{server.quality} Quality</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Season & Episode Selection for TV Shows */}
            {mediaType === 'tv' && details?.seasons && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Select Episode</h3>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {/* Season Selector */}
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-2 block">Season:</label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {details.seasons
                        .filter((s: any) => s.season_number > 0)
                        .map((season: any) => (
                          <option key={season.id} value={season.season_number}>
                            Season {season.season_number} ({season.episode_count} episodes)
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Episode Selector */}
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-2 block">Episode:</label>
                    <select
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
                      disabled={loadingSeason}
                      className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                    >
                      {seasonData?.episodes ? (
                        seasonData.episodes.map((ep: any) => (
                          <option key={ep.id} value={ep.episode_number}>
                            Episode {ep.episode_number}: {ep.name}
                          </option>
                        ))
                      ) : (
                        <option value={1}>Episode 1</option>
                      )}
                    </select>
                  </div>
                </div>
                
                <Button
                  onClick={() => { try { addToHistory(); } catch {} window.open(getCurrentStreamUrl(), '_blank'); }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Open Selected Episode
                </Button>
              </div>
            )}

            {/* For Movies - Direct Open Button */}
            {mediaType === 'movie' && (
              <div className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={() => { try { addToHistory(); } catch {} setShowPlayer(true); }}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Play Inline
                  </Button>

                  <Button
                    onClick={() => { try { addToHistory(); } catch {} window.open(getCurrentStreamUrl(), '_blank'); }}
                    className="w-full bg-secondary text-foreground hover:bg-secondary/90"
                    size="sm"
                  >
                    Open in {streamingServers[selectedServer as keyof typeof streamingServers].name}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline player iframe (attempt to embed without sandbox). If server disallows embedding, user can open in new tab using the button above. */}
      {showPlayer && (
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="bg-card rounded-lg border border-border overflow-hidden p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Player</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => { try { addToHistory(); } catch {} window.open(getCurrentStreamUrl(), '_blank'); }}>Open in new tab</Button>
                <Button size="sm" variant="outline" onClick={() => setShowPlayer(false)}>Close</Button>
              </div>
            </div>
            {streamUrl ? (
  <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
    <iframe
      title="Inline player"
      src={streamUrl}
      className="w-full h-full border-0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      
    />
  </div>
            ) : (
              <div className="p-6">
                <p className="mb-3">Player is not available inline for the selected server. You can try another server or open it in a new tab.</p>
                <div className="flex gap-3">
                  <Button onClick={() => { try { addToHistory(); } catch {} window.open(getCurrentStreamUrl(), '_blank'); }}>Open in new tab</Button>
                  <Button variant="outline" onClick={() => setShowPlayer(false)}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cast & Crew */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-6">Cast & Crew</h2>
        
        {director && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Director</h3>
            <p className="text-xl">{director.name}</p>
          </div>
        )}

        {producers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Producers</h3>
            <p className="text-xl">{producers.map(p => p.name).join(', ')}</p>
          </div>
        )}

        <h3 className="text-lg font-semibold text-muted-foreground mb-4">Cast</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {credits?.cast.slice(0, 12).map(actor => (
            <div key={actor.id} className="text-center">
              <img
                src={getImageUrl(actor.profile_path, 'w200')}
                alt={actor.name}
                className="w-full aspect-square object-cover rounded-lg mb-2"
              />
              <p className="font-semibold text-sm">{actor.name}</p>
              <p className="text-xs text-muted-foreground">{actor.character}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-6">Reviews</h2>
          <div className="space-y-6">
            {reviews.slice(0, 10).map(review => (
              <div key={review.id} className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-xl font-bold">
                    {review.author[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{review.author}</p>
                    {review.author_details.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span>{review.author_details.rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-foreground/90 line-clamp-4">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <MovieRow 
            title="Similar Titles" 
            movies={similar} 
            mediaType={mediaType}
          />
        </div>
      )}
    </div>
  );
};

export default MovieDetails;