import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Error Icon */}
        <div className="inline-block p-4 bg-destructive border-3 border-foreground shadow-[6px_6px_0px_hsl(var(--foreground))] mb-6" style={{ borderWidth: '3px' }}>
          <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive-foreground" strokeWidth={2} />
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl sm:text-8xl font-black uppercase tracking-tighter mb-4"
          style={{
            WebkitTextStroke: '3px hsl(var(--foreground))',
            WebkitTextFillColor: 'hsl(var(--primary))',
            textShadow: '4px 4px 0px hsl(var(--foreground))'
          }}
        >
          404
        </h1>

        <p className="text-lg sm:text-xl font-black uppercase text-muted-foreground mb-6">
          PAGE NOT FOUND
        </p>

        {/* Home Button */}
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-primary-foreground font-black text-sm uppercase border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 flex items-center gap-2 mx-auto"
        >
          <Home className="h-4 w-4" strokeWidth={2.5} />
          GO HOME
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
