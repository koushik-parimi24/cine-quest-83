import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb, getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import { MovieDetails as MovieDetailsType, Credits, Video, Review, MediaType } from '@/types/movie';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MovieRow } from '@/components/MovieRow';
import { Play, Plus, Check, ArrowLeft, DollarSign, Calendar, Clock, Star } from 'lucide-react';
import { watchLaterService } from '@/lib/watchLater';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const MovieDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const mediaType = type as MediaType;
  const [details, setDetails] = useState<MovieDetailsType | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<any[]>([]);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedServer, setSelectedServer] = useState('server1');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  useEffect(() => {
    if (id) {
      loadDetails();
      setIsInWatchLater(watchLaterService.isInWatchLater(parseInt(id)));
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

  const handleWatchLater = () => {
    if (details) {
      watchLaterService.toggle(details as any);
      setIsInWatchLater(!isInWatchLater);
      toast.success(isInWatchLater ? 'Removed from Watch Later' : 'Added to Watch Later');
    }
  };

  const streamingServers = {
    server1: {
      name: 'VidLink',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
          : `https://vidlink.pro/movie/${tmdbId}`,
      quality: 'HD',
    },
    server2: {
      name: 'VidSrc',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
          : `https://vidsrc.me/embed/movie/${tmdbId}`,
      quality: 'HD+',
    },
    server3: {
      name: '2Embed',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://www.2embed.cc/embedtv/${tmdbId}/${season}/${episode}`
          : `https://www.2embed.cc/embed/${tmdbId}`,
      quality: 'HD',
    },
    server4: {
      name: 'VidEasy',
      url: (tmdbId: string, mediaType: string, season?: number, episode?: number) =>
        mediaType === 'tv'
          ? `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`
          : `https://player.videasy.net/movie/${tmdbId}?overlay=true`,
      quality: 'HD',
    },
  };

  const getCurrentStreamUrl = () => {
    const server = streamingServers[selectedServer as keyof typeof streamingServers];
    return server.url(id!, mediaType, selectedSeason, selectedEpisode);
  };

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
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${getBackdropUrl(details.backdrop_path)})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
          <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 lg:px-8 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="grid lg:grid-cols-[300px,1fr] gap-8 items-start">
            {/* Poster */}
            <img
              src={getImageUrl(details.poster_path, 'w500')}
              alt={title}
              className="rounded-lg shadow-2xl w-full"
            />

            {/* Details */}
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-5xl font-black">{title}</h1>
              
              {details.tagline && (
                <p className="text-xl text-muted-foreground italic">{details.tagline}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent fill-accent" />
                  <span className="text-lg font-bold">{details.vote_average.toFixed(1)}</span>
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
                  onClick={() => setShowPlayer(!showPlayer)}
                >
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  Watch Now
                </Button>
                {trailer && (
                  <Button
                    size="lg"
                    className="bg-[var(--gradient-secondary)] hover:shadow-[var(--shadow-glow)] transition-all hover:scale-105 touch-manipulation"
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
                      setSelectedServer(key);
                      window.open(getCurrentStreamUrl(), '_blank');
                    }}
                    className="p-4 rounded-lg border-2 transition-all hover:scale-105 bg-secondary hover:bg-secondary/80 border-border hover:border-primary group"
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
                  onClick={() => window.open(getCurrentStreamUrl(), '_blank')}
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
                <Button
                  onClick={() => window.open(getCurrentStreamUrl(), '_blank')}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Open in {streamingServers[selectedServer as keyof typeof streamingServers].name}
                </Button>
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
            {reviews.slice(0, 3).map(review => (
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
