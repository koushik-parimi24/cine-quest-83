import { SkeletonCard } from './SkeletonCard';

interface SkeletonRowProps {
  title?: boolean;
  count?: number;
}

export const SkeletonRow = ({ title = true, count = 6 }: SkeletonRowProps) => {
  return (
    <div className="space-y-4">
      {/* Title skeleton - Brutalist */}
      {title && (
        <div className="px-3 sm:px-4 lg:px-8 flex items-center gap-4">
          <div className="h-8 w-48 bg-muted border-2 border-foreground shimmer" />
          <div className="h-1 w-24 bg-muted-foreground/30" />
        </div>
      )}
      
      {/* Cards row */}
      <div className="flex gap-4 overflow-hidden px-3 sm:px-4 lg:px-8">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonRow;
