"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Radio } from "lucide-react"

interface LiveChannel {
  stream_id: number
  name: string
  stream_icon: string
  category_id: string
}

interface LiveChannelCardProps {
  channel: LiveChannel
  onClick: () => void
}

export function LiveChannelCard({ channel, onClick }: LiveChannelCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl border-0 bg-card/50 backdrop-blur-sm min-w-[140px] will-change-transform"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!imageLoaded && !imageError && <div className="absolute inset-0 animate-pulse bg-muted" />}
          {channel.stream_icon && !imageError ? (
            <img
              src={channel.stream_icon || "/placeholder.svg"}
              alt={channel.name}
              loading="lazy"
              className={`w-full h-full object-contain p-3 transition-all duration-200 group-hover:scale-110 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <Radio className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}

          <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        </div>

        <div className="p-2">
          <h3 className="font-semibold text-xs line-clamp-2">{channel.name}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
