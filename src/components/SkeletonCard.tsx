import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className }: SkeletonCardProps) => {
  return (
    <div className={cn("relative w-full", className)}>
      {/* Poster skeleton - Brutalist */}
      <div 
        className="relative overflow-hidden bg-muted border-3 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]"
        style={{ borderWidth: '3px' }}
      >
        <div className="w-full aspect-[2/3] shimmer" />
        
        {/* Rating badge skeleton */}
        <div 
          className="absolute top-0 right-0 w-14 h-7 bg-muted-foreground/30"
          style={{ borderWidth: '0 0 3px 3px', borderColor: 'hsl(var(--foreground))', borderStyle: 'solid' }}
        />
      </div>
      
      {/* Title skeleton */}
      <div className="mt-3 h-4 w-3/4 bg-muted border-2 border-foreground shimmer" />
      
      {/* Year skeleton */}
      <div className="mt-2 h-3 w-1/3 bg-muted border-2 border-foreground shimmer" />
    </div>
  );
};

export default SkeletonCard;
