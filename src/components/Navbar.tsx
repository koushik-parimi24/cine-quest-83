import { Search, Bookmark, Menu, X, Star, Home, Film, Tv, TrendingUp, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { toast } from 'sonner';
import { tmdb } from '@/lib/tmdb';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onSearch: (query: string) => void;
}

const navItems = [
  { label: 'HOME', path: '/', query: '', icon: Home },
  { label: 'MOVIES', path: '/', query: 'type=movie', icon: Film },
  { label: 'TV', path: '/', query: 'type=tv', icon: Tv },
  { label: 'HOT', path: '/', query: 'filter=popular', icon: TrendingUp },
];

export const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowProfileMenu(false);
    toast.success('Logged out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setShowSearch(false);
      onSearch(searchQuery);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await tmdb.searchMulti(searchQuery);
        const results = data.results || [];

        const topResults = results
          .filter((item: any) => (item.title || item.name) && item.vote_average > 0)
          .sort((a: any, b: any) => b.vote_average - a.vote_average)
          .slice(0, 6);

        setSuggestions(topResults);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const delay = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${
        isScrolled 
          ? 'bg-background border-b-3 border-foreground shadow-[0_4px_0px_hsl(var(--foreground))]' 
          : 'bg-background/95'
      }`}
      style={{ borderBottomWidth: isScrolled ? '3px' : '0' }}
    >
      <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between h-14 sm:h-16 relative">
        {/* Logo - Brutalist */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 group flex-shrink-0"
        >
          <div className="bg-primary p-1.5 sm:p-2 border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all duration-100">
            <span className="font-black text-primary-foreground text-sm sm:text-lg">CQ</span>
          </div>
          <span className="hidden md:inline text-base lg:text-lg font-black uppercase tracking-tight">
            CINE<span className="text-primary">QUEST</span>
          </span>
        </button>

        {/* Navigation Tabs - Hidden on small, compact on medium */}
        <div className="hidden md:flex items-center gap-1 ml-4 lg:ml-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.query 
              ? location.search.includes(item.query)
              : location.pathname === '/' && !location.search;
            
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.query ? `${item.path}?${item.query}` : item.path)}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1.5 lg:py-2 text-xs font-black uppercase tracking-wide transition-all duration-100 border-2 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]' 
                    : 'bg-transparent border-transparent hover:bg-muted hover:border-foreground'
                }`}
              >
                <Icon className="h-3 w-3 lg:h-4 lg:w-4" strokeWidth={2.5} />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar - Responsive */}
        <div className="flex-1 mx-2 sm:mx-4 max-w-xs sm:max-w-sm lg:max-w-md relative" ref={searchRef}>
          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" strokeWidth={2.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH..."
              className="w-full pl-10 pr-4 py-2 bg-background border-3 border-foreground text-xs sm:text-sm font-bold uppercase placeholder:text-muted-foreground focus:outline-none focus:shadow-[4px_4px_0px_hsl(var(--primary))] transition-all duration-100"
              style={{ borderWidth: '3px' }}
            />
          </form>

          {/* Mobile Search Icon */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="sm:hidden p-2 bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </button>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 w-full bg-card border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] overflow-hidden z-50"
                style={{ borderWidth: '3px' }}
              >
                {suggestions.map((item: any) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 flex items-center gap-2 border-b-2 border-muted last:border-0 hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all duration-100"
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery('');
                      navigate(`/${item.media_type}/${item.id}`);
                    }}
                  >
                    {item.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt=""
                        className="w-8 h-12 object-cover border-2 border-foreground"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-black uppercase truncate block">
                        {item.title || item.name}
                      </span>
                      <span className="text-xs font-bold opacity-70 uppercase">
                        {item.media_type === 'movie' ? 'MOVIE' : 'TV'}
                      </span>
                    </div>
                    <div className="bg-accent text-accent-foreground px-1.5 py-0.5 text-xs font-black">
                      ★{item.vote_average.toFixed(1)}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Watch Later - Icon only on small */}
          <button
            onClick={() => navigate('/watch-later')}
            className="hidden sm:flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 bg-secondary text-secondary-foreground text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            <Bookmark className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden lg:inline">LIST</span>
          </button>

          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Profile Section */}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-0.5 border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 overflow-hidden"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 sm:w-9 sm:h-9 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                )}
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-48 sm:w-56 bg-card border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] overflow-hidden z-50"
                    style={{ borderWidth: '3px' }}
                  >
                    <div className="p-3 border-b-2 border-foreground bg-muted">
                      <p className="font-black text-xs sm:text-sm uppercase truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate('/watch-later');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-xs font-black uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-100"
                      >
                        <Bookmark className="h-3 w-3" strokeWidth={2.5} />
                        MY LIST
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2 py-2 text-xs font-black uppercase text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-100"
                      >
                        <X className="h-3 w-3" strokeWidth={2.5} />
                        SIGN OUT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="hidden sm:flex px-3 lg:px-4 py-2 bg-primary text-primary-foreground text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
            >
              SIGN IN
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 bg-primary text-primary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-4 w-4" strokeWidth={2.5} /> : <Menu className="h-4 w-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-background border-t-2 border-foreground p-3"
          >
            <form onSubmit={handleSearch} className="flex items-center relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" strokeWidth={2.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH..."
                autoFocus
                className="w-full pl-10 pr-4 py-2 bg-background border-3 border-foreground text-sm font-bold uppercase placeholder:text-muted-foreground focus:outline-none focus:shadow-[4px_4px_0px_hsl(var(--primary))] transition-all duration-100"
                style={{ borderWidth: '3px' }}
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu - Brutalist */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-background border-t-3 border-foreground overflow-hidden"
            style={{ borderTopWidth: '3px' }}
          >
            <div className="container mx-auto px-3 py-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.query ? `${item.path}?${item.query}` : item.path);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black uppercase border-2 border-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-100"
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.5} />
                    {item.label}
                  </button>
                );
              })}
              <div className="border-t-2 border-foreground pt-2 mt-2 space-y-2">
                <button
                  onClick={() => {
                    navigate('/watch-later');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black uppercase border-2 border-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-100"
                >
                  <Bookmark className="h-4 w-4" strokeWidth={2.5} />
                  MY LIST
                </button>
                <div className="flex gap-2">
                  <ThemeToggle />
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-black uppercase text-destructive border-2 border-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-100"
                    >
                      <X className="h-4 w-4" strokeWidth={2.5} />
                      SIGN OUT
                    </button>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-black uppercase bg-primary text-primary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]"
                    >
                      <User className="h-4 w-4" strokeWidth={2.5} />
                      SIGN IN
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
