import { Search, Bookmark, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface NavbarProps {
  onSearch: (query: string) => void;
}

export const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll listener
  useState(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <div className="p-2 rounded-lg bg-[var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Film className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black bg-[var(--gradient-primary)] bg-clip-text text-transparent">
              CinemaHub
            </span>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 max-w-md flex-1 mx-8">
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
            <Button type="submit" size="icon" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Watch Later Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/watch-later')}
            className="gap-2 border-border/50 hover:border-accent hover:text-accent"
          >
            <Bookmark className="h-4 w-4" />
            <span className="hidden lg:inline">Watch Later</span>
          </Button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
        </form>
      </div>
    </nav>
  );
};
