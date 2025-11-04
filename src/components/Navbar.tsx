import { Search, Bookmark, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { tmdb } from '@/lib/tmdb';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface NavbarProps {
  onSearch: (query: string) => void;
}

export const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Fetch current user session when component mounts
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
      }
    };
    getUser();

    // ✅ Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const userName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        session.user.email?.split('@')[0] || 
                        'User';
        toast.success(`Welcome back, ${userName}!`, {
          duration: 3000,
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => authListener?.subscription.unsubscribe();
  }, []);

  // ✅ Login / Logout handlers
  const handleLogin = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      console.log('Attempting login with redirect:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }
      
      console.log('OAuth initiated:', data);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please check Supabase configuration.');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  // ✅ Debounced TMDB search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await tmdb.searchMulti(searchQuery);

        const sortedResults = res.results
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))
          .slice(0, 7);

        setSuggestions(sortedResults);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ✅ Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (item: any) => {
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    setSearchQuery('');
    setSuggestions([]);
    navigate(`/${mediaType}/${item.id}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg shadow-lg">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img
              src="https://anmelxfindmnmefmtbdo.supabase.co/storage/v1/object/public/logo/logo.png"
              alt="CineHub"
              className="w-16 h-10 object-cover rounded-full"
            />
          </button>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center gap-2 max-w-md flex-1 mx-8 relative search-container"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies & TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-accent"
              />

              {/* Suggestions */}
              <AnimatePresence>
                {!loading && suggestions.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-1 shadow-lg max-h-80 overflow-y-auto z-50"
                  >
                    {suggestions.map((item) => (
                      <motion.li
                        key={item.id}
                        onClick={() => handleSuggestionClick(item)}
                        className="px-4 py-2 cursor-pointer hover:bg-accent/10 transition-colors flex items-center gap-3"
                      >
                        <img
                          src={
                            item.poster_path
                              ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                              : 'https://t3.ftcdn.net/jpg/16/02/53/98/360_F_1602539837_c3caxx8KTAJITm4g9Nkz5xUXbEJ7eo2K.jpg'
                          }
                          alt={item.title || item.name}
                          className="w-14 h-20 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-sm">{item.title || item.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{item.media_type}</span>
                            {item.vote_average && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                {item.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="profile"
                    className="w-8 h-8 rounded-full border border-gray-500"
                  />
                )}
                <span className="text-sm text-gray-300 hidden sm:inline">
                  Hi, {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                </span>
                <Button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
              >
                Login with Google
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/watch-later')}
              className="gap-2 border-accent/50 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden lg:inline">Watch Later</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
