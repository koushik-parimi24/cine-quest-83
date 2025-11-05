import { Search, Bookmark, Menu, X, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { toast } from 'sonner';
import { tmdb } from '@/lib/tmdb'; // ✅ make sure you have tmdb client setup

export const Navbar = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) setUser(data.session.user);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  // ✅ Handle Login / Logout
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      onSearch(searchQuery);
    }
  };

  // ✅ Fetch live search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await tmdb.searchMulti(searchQuery);
        const results = data.results || [];

        // Filter valid titles and sort by rating (descending)
        const topResults = results
          .filter(
            (item: any) => (item.title || item.name) && item.vote_average > 0
          )
          .sort((a: any, b: any) => b.vote_average - a.vote_average)
          .slice(0, 6); // limit to top 6

        setSuggestions(topResults);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const delay = setTimeout(fetchSuggestions, 300); // debounce input
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // ✅ Close suggestions when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-gray-800 shadow-md transition-all duration-300">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 relative">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
          <img
            src="https://anmelxfindmnmefmtbdo.supabase.co/storage/v1/object/public/logo/logo.png"
            alt="CineQuest Logo"
            className="w-10 h-8 object-contain"
          />
          <span className="hidden sm:inline text-lg font-semibold tracking-tight text-white group-hover:text-red-500 transition">
            Cine<span className="text-red-500">Quest</span>
          </span>
        </button>

        {/* Search Bar */}
        <div className="flex-1 mx-4 max-w-md sm:max-w-lg relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="flex items-center relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies & TV shows..."
              className="w-full pl-10 border border-gray-700  placeholder:text-gray-700 rounded-full focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
            />
          </form>

          {/* 🔽 Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-[#141414] border border-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
              {suggestions.map((item: any) => (
                <div
                  key={item.id}
                  className="px-4 py-2 flex justify-between items-center border-b border-gray-800 hover:bg-[#1f1f1f] cursor-pointer transition"
                  onClick={() => {
                    setShowSuggestions(false);
                    navigate(`/${item.media_type}/${item.id}`);
                  }}
                >
                  <span className="text-gray-200 text-sm truncate">
                    {item.title || item.name}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Star className="h-3 w-3 fill-current" />
                    {item.vote_average.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="profile"
                    className="w-8 h-8 rounded-full border border-gray-600"
                  />
                )}
                <span className="text-sm text-gray-400 font-medium">
                  Hi, {user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0]}
                </span>

                <Button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full text-sm px-4 py-1.5 transition-all hover:scale-105"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full text-sm px-4 py-1.5 transition-all hover:scale-105"
              >
                Login
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate('/watch-later')}
              className="gap-2 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white transition-all hover:scale-105 rounded-full"
            >
              <Bookmark className="h-4 w-4" />
              Watch Later
            </Button>
            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-[#1a1a1a] transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>
      </div>
    </nav>
  );
};
