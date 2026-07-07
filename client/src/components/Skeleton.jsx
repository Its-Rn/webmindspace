export const Skeleton = ({ className = '', variant = 'rect', width, height }) => {
  const base = 'animate-pulse bg-[rgb(var(--border))] rounded-xl';
  const style = width || height ? { width, height } : {};
  return <div className={`${base} ${variant === 'circle' ? 'rounded-full' : ''} ${className}`} style={style} />;
};

export const CardSkeleton = () => (
  <div className="surface-card space-y-4 p-6">
    <Skeleton className="h-5 w-3/5" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

export const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="surface-card flex items-center gap-4 p-4">
        <Skeleton variant="circle" className="size-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="surface-card space-y-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    ))}
  </div>
);
