import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { Bookmark, LogIn } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const WatchLater = () => {
  const navigate = useNavigate();
  const { user, watchlist } = useWatchlist();

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/watch-later`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}&type=movie`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-36 ">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Watch Later</h1>
        </div>

        {!user ? (
          <div className="text-center py-12">
            <LogIn className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground mb-4">
              Please login to view your watchlist
            </p>
            <Button 
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login with Google
            </Button>
          </div>
        ) : watchlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {watchlist.map((item) => (
              <MovieCard 
                key={item.media_id} 
                movie={{
                  id: item.media_id,
                  title: item.title || item.original_title,
                  name: item.original_name,
                  poster_path: item.poster_path,
                  vote_average: item.vote_average,
                  release_date: item.release_date,
                  first_air_date: item.first_air_date,
                  media_type: item.media_type,
                } as any}
                mediaType={item.media_type} 
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
