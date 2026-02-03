import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { Bookmark, LogIn, Bell, BellOff } from 'lucide-react';
import { useEmailPreferences } from '@/hooks/useEmailPreferences';
import { useWatchlist } from '@/hooks/useWatchlist';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

const WatchLater = () => {
  const navigate = useNavigate();
  const { user, watchlist } = useWatchlist();
  const { preferences, loading: prefLoading, toggleReminder } = useEmailPreferences();

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

  const handleToggleReminder = async () => {
    await toggleReminder(!preferences.reminder_enabled);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 sm:pt-32">
        {/* Header - Brutalist */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="p-2 sm:p-3 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]">
            <Bookmark className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
            MY LIST
          </h1>
          <div className="h-1 w-16 sm:w-24 bg-primary" />
          
          {/* Email Reminder Toggle */}
          {user && !prefLoading && (
            <button
              onClick={handleToggleReminder}
              className={`ml-auto flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 ${
                preferences.reminder_enabled 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}
              title={preferences.reminder_enabled ? 'Email reminders ON' : 'Email reminders OFF'}
            >
              {preferences.reminder_enabled ? (
                <>
                  <Bell className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">REMINDERS ON</span>
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">REMINDERS OFF</span>
                </>
              )}
            </button>
          )}
        </motion.div>

        {!user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-block p-4 bg-muted border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] mb-6" style={{ borderWidth: '3px' }}>
              <LogIn className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-lg sm:text-xl font-black uppercase text-muted-foreground mb-4">
              PLEASE LOGIN TO VIEW YOUR WATCHLIST
            </p>
            <button 
              onClick={handleLogin}
              className="px-6 py-3 bg-primary text-primary-foreground font-black text-sm uppercase border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 flex items-center gap-2 mx-auto"
            >
              <LogIn className="h-4 w-4" strokeWidth={2.5} />
              LOGIN WITH GOOGLE
            </button>
          </motion.div>
        ) : watchlist.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6 pt-4 pb-8"
          >
            {watchlist.map((item, index) => (
              <motion.div
                key={item.media_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
              >
                <MovieCard 
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
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-block p-4 bg-muted border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] mb-6" style={{ borderWidth: '3px' }}>
              <Bookmark className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-lg sm:text-xl font-black uppercase text-muted-foreground mb-2">
              YOUR LIST IS EMPTY
            </p>
            <p className="text-sm text-muted-foreground uppercase">
              START ADDING MOVIES AND TV SHOWS TO WATCH!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WatchLater;
