import { SkeletonCard } from "./skeleton-card"

export function SkeletonCarousel() {
  return (
    <div className="space-y-4 mb-8">
      {/* Title skeleton */}
      <div className="h-7 w-48 bg-muted rounded animate-pulse" />

      {/* Cards skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[200px]">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  )
}
