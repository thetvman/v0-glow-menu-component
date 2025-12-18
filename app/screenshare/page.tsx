"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ArrowRight, Loader2, CheckCircle } from "lucide-react"
import { joinWatchSession } from "@/lib/watch-session"

function ScreenshareContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get("code") || "")
  const [error, setError] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    // Auto-join if code is in URL
    const urlCode = searchParams.get("code")
    if (urlCode && urlCode.length === 6) {
      handleJoin(urlCode)
    }
  }, [searchParams])

  const handleJoin = async (joinCode?: string) => {
    const sessionCode = joinCode || code

    if (!sessionCode.trim()) {
      setError("Please enter a session code")
      return
    }

    if (sessionCode.length !== 6) {
      setError("Session code must be 6 characters")
      return
    }

    setIsJoining(true)
    setError("")

    console.log("[v0] Joining session with code:", sessionCode)

    const session = await joinWatchSession(sessionCode)

    if (!session) {
      setError("Session not found. Make sure the host created the session and you're using the correct code.")
      setIsJoining(false)
      console.log("[v0] Failed to join - session not found")
      return
    }

    console.log("[v0] Successfully joined session, redirecting...")
    router.push(`/watch-guest/${session.id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Users className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Watch Together
            </h1>
            <p className="text-muted-foreground text-lg">Enter the session code to join your friends</p>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-500">Cross-Device Syncing Enabled</p>
            <p className="text-xs text-muted-foreground">
              Watch together from any device on any network with real-time Supabase sync
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError("")
              }}
              maxLength={6}
              className="text-center text-2xl font-bold tracking-wider h-14 border-2 focus:border-purple-500"
              disabled={isJoining}
            />
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                <p className="text-sm text-red-500 text-center">{error}</p>
              </div>
            )}
          </div>

          <Button
            onClick={() => handleJoin()}
            disabled={isJoining || code.length !== 6}
            className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining Session...
              </>
            ) : (
              <>
                Join Session
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
            <p>Everyone in the session can control playback</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
            <p>Playback automatically syncs between all viewers</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
            <p>Perfect for watching with friends and family remotely</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
            <p>No IPTV login required for guests</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ScreensharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <ScreenshareContent />
    </Suspense>
  )
}
