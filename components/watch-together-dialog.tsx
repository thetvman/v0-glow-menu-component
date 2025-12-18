"use client"

import { useState } from "react"
import { Share2, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { WatchTogetherManager } from "@/lib/watch-together"

interface Props {
  videoType: string
  videoId: string
  videoTitle: string
  streamUrl: string
  onSessionStart: (sessionId: string) => void
}

export function WatchTogetherDialog({ videoType, videoId, videoTitle, streamUrl, onSessionStart }: Props) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    setLoading(true)
    const manager = new WatchTogetherManager()
    const result = await manager.createSession(videoType, videoId, videoTitle, streamUrl)

    if (result) {
      setCode(result.code)
      onSessionStart(result.sessionId)
    }
    setLoading(false)
  }

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          title="Watch together"
        >
          <Share2 className="w-5 h-5 text-white" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Watch Together</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!code ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Create a watch session and share the code with friends to watch together in sync
              </p>
              <Button onClick={handleShare} disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Watch Session"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700">
                <p className="text-sm text-muted-foreground mb-2 text-center">Share this code:</p>
                <p className="text-4xl font-bold text-center tracking-wider text-purple-600 dark:text-purple-400">
                  {code}
                </p>
              </div>
              <Button onClick={copyCode} variant="outline" className="w-full gap-2 bg-transparent">
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Friends can enter this code on the screenshare page to join
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
