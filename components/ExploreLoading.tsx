export function ExploreLoading() {
  return (
    <main className="h-screen flex flex-col overflow-hidden overscroll-none">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <span className="text-xs text-[var(--foreground)]/50">
          &larr; transmissions
        </span>
      </div>

      {/* Skeleton panels */}
      <div className="flex-1 flex flex-col md:flex-row gap-px overflow-hidden px-6 pb-6">
        {/* Quotes panel skeleton */}
        <div className="flex-1 md:w-3/4 space-y-4 overflow-hidden p-4">
          <div className="h-4 w-24 bg-[var(--foreground)]/10 rounded animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div
                  className="h-3 bg-[var(--foreground)]/8 rounded animate-pulse"
                  style={{ width: `${70 + (i % 3) * 10}%`, animationDelay: `${i * 100}ms` }}
                />
                <div
                  className="h-3 bg-[var(--foreground)]/5 rounded animate-pulse"
                  style={{ width: `${40 + (i % 4) * 12}%`, animationDelay: `${i * 100 + 50}ms` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stats panel skeleton */}
        <div className="hidden md:block md:w-1/4 space-y-4 overflow-hidden p-4">
          <div className="h-4 w-16 bg-[var(--foreground)]/10 rounded animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 bg-[var(--foreground)]/6 rounded animate-pulse"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
