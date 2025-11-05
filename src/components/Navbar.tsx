import { Search, Bookmark, Star, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from './ThemeToggle';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { tmdb } from '@/lib/tmdb';
import { useNavigate } from 'react-router-dom';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) setUser(data.session.user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener?.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const redirectUrl = `${window.location.origin}/`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await tmdb.searchMulti(searchQuery);
      const sortedResults = res.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 7);
      setSuggestions(sortedResults);
      setLoading(false);
    }, 500);

    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchQuery]);

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

          {/* Desktop Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) onSearch(searchQuery);
            }}
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
            </div>
          </form>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3">
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
                <span className="text-sm text-gray-300">
                  Hi, {user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]}
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
                Login
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/watch-later')}
              className="gap-2 border-accent/50 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
            >
              <Bookmark className="h-4 w-4" />
              <span>Watch Later</span>
            </Button>
          </div>

          {/* Mobile Burger Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-800 transition"
          >
            {menuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>

        {/* Mobile Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) onSearch(searchQuery);
          }}
          className="flex md:hidden mt-2 mb-2 relative search-container"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 w-full"
            />
          </div>
        </form>
      </div>

      {/* Mobile Slide-out Menu */}
     {/* Mobile Slide-out Menu */}
<AnimatePresence>
  {menuOpen && (
    <>
      {/* 🩶 Background Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setMenuOpen(false)} // close menu on click outside
        className="fixed inset-0 bg-black z-[998]"
      />

      {/* 🧭 Bottom Menu */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed  -bottom-64 left-0 right-0 bg-black border-t border-gray-700 backdrop-blur-xl p-5 flex flex-col items-center gap-4 md:hidden z-[999] rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.3)]"
      >
        {user ? (
          <>
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="profile"
                className="w-12 h-12 rounded-full border border-gray-500"
              />
            )}
            <p className="text-gray-200 text-sm">
              {user.user_metadata?.full_name || user.email.split('@')[0]}
            </p>

            <Button
              onClick={() => {
                setMenuOpen(false);
                navigate('/watch-later');
              }}
              className="w-full bg-gray-800 text-white hover:bg-gray-700"
            >
              <Bookmark className="h-4 w-4 mr-2" /> Watch Later
            </Button>

            <ThemeToggle />

            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <ThemeToggle />
            <Button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login with Google
            </Button>
          </>
        )}
      </motion.div>
    </>
  )}
</AnimatePresence>

    </nav>
  );
};
