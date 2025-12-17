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

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-card/50 backdrop-blur-sm min-w-[160px]"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {channel.stream_icon && !imageError ? (
            <img
              src={channel.stream_icon || "/placeholder.svg"}
              alt={channel.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <Radio className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Live indicator */}
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-1">{channel.name}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
