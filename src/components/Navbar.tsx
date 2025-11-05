import { Search, Bookmark, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { toast } from 'sonner';

export const Navbar = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Get Supabase user session
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
    toast.success('Logged out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) onSearch(searchQuery);
  };

  return (
    <nav className="fixed top-0 left-0 right-0   backdrop-blur-md border-b border-gray-800 shadow-md transition-all duration-300">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group"
        >
          <img
            src="https://anmelxfindmnmefmtbdo.supabase.co/storage/v1/object/public/logo/logo.png"
            alt="CineQuest Logo"
            className="w-10 h-8 object-contain"
          />
          <span className="hidden sm:inline text-lg font-semibold tracking-tight group-hover:text-pink-500 transition">
            Cine<span className="text-pink-500">Quest</span>
          </span>
        </button>

        {/* Search Bar (Always visible) */}
        <form
          onSubmit={handleSearch}
          className="flex-1 mx-4 flex items-center max-w-md sm:max-w-lg relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies & TV shows..."
            className="w-full pl-10  border border-gray-700 text-white placeholder:text-gray-400 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
          />
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Desktop Buttons */}
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
                <span className="text-sm text-gray-500 font-medium">
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

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-[#1a1a1a] transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden bg-[#0d0d0d]/95 border-t border-gray-800 p-4 flex flex-col gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="profile"
                    className="w-8 h-8 rounded-full border border-gray-600"
                  />
                )}
                <span className="text-sm text-gray-200 font-medium">
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0]}
                </span>
              </div>

              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white w-full rounded-full"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={handleLogin}
              className="bg-red-600 hover:bg-red-700 text-white w-full rounded-full"
            >
              Login with Google
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => navigate('/watch-later')}
            className="gap-2 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white transition-all rounded-full w-full"
          >
            <Bookmark className="h-4 w-4" />
            Watch Later
          </Button>
        </div>
      )}
    </nav>
  );
};
