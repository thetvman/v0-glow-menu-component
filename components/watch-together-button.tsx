"use client"

import { useState } from "react"
import { Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WatchTogetherManager } from "@/lib/watch-together"

interface WatchTogetherButtonProps {
  videoUrl: string
  videoTitle: string
  videoType: string
  streamUrl: string
  onSessionCreated?: (sessionId: string, code: string) => void
}

export function WatchTogetherButton({
  videoUrl,
  videoTitle,
  videoType,
  streamUrl,
  onSessionCreated,
}: WatchTogetherButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionCode, setSessionCode] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateSession = async () => {
    console.log("[v0] Creating watch session...")
    setIsCreating(true)

    try {
      const manager = new WatchTogetherManager()
      const result = await manager.createSession(videoType, videoUrl, videoTitle, streamUrl)

      if (!result) {
        throw new Error("Failed to create session")
      }

      console.log("[v0] Session created:", result.sessionId, "Code:", result.code)
      setSessionCode(result.code)
      setIsOpen(true)

      setTimeout(() => {
        onSessionCreated?.(result.sessionId, result.code)
      }, 1000)
    } catch (error) {
      console.error("[v0] Failed to create session:", error)
      alert("Failed to create watch session. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/screenshare?code=${sessionCode}` : ""

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCreateSession}
        disabled={isCreating}
        className="hover:bg-white/20"
        title="Watch Together"
      >
        <Share2 className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Watch Together
            </DialogTitle>
            <DialogDescription>Share this code with friends to watch together in sync</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Code</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-3xl font-bold text-center tracking-wider text-purple-400">{sessionCode}</p>
                </div>
                <Button size="icon" variant="outline" onClick={handleCopyCode} className="shrink-0 bg-transparent">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-xs text-muted-foreground">✓ Everyone can control playback</p>
              <p className="text-xs text-muted-foreground">✓ Automatically syncs play, pause, and seek</p>
              <p className="text-xs text-muted-foreground">✓ Session expires after 24 hours</p>
              <p className="text-xs text-muted-foreground">✓ Guests can join without IPTV login</p>
              <p className="text-xs text-green-500 font-medium">✓ Works across all devices with Supabase Realtime</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
