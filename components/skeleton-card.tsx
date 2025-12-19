export function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-muted animate-pulse">
      <div className="aspect-[2/3] bg-muted-foreground/10" />
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  )
}

export function SkeletonChannelCard() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-muted animate-pulse">
      <div className="aspect-video bg-muted-foreground/10" />
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  )
}
