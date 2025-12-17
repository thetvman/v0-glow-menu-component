"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ArrowRight, Loader2 } from "lucide-react"
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
    if (urlCode) {
      handleJoin(urlCode)
    }
  }, [searchParams])

  const handleJoin = async (joinCode?: string) => {
    const sessionCode = joinCode || code

    if (!sessionCode.trim()) {
      setError("Please enter a session code")
      return
    }

    setIsJoining(true)
    setError("")

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const session = joinWatchSession(sessionCode)

    if (!session) {
      setError("Invalid session code. Please check and try again.")
      setIsJoining(false)
      return
    }

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
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>

          <Button
            onClick={() => handleJoin()}
            disabled={isJoining || code.length < 6}
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
