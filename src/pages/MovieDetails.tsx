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
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchLater = () => {
    if (details) {
      watchLaterService.toggle(details as any);
      setIsInWatchLater(!isInWatchLater);
      toast.success(isInWatchLater ? 'Removed from Watch Later' : 'Added to Watch Later');
    }
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
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer?.key || ''}`, '_blank')}
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
