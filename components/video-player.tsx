"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Users, RotateCcw } from "lucide-react"
import { WatchTogetherDialog } from "./watch-together-dialog"
import { WatchTogetherManager, type WatchSession } from "@/lib/watch-together"

interface VideoPlayerProps {
  src: string
  title: string
  subtitle?: string
  onBack?: () => void
  videoType?: string
  videoIdentifier?: string
  streamUrl?: string
  activeSessionId?: string
  onSessionStart?: (id: string) => void
  isHost?: boolean
}

export function VideoPlayer({
  src,
  title,
  subtitle,
  videoType,
  videoIdentifier,
  streamUrl,
  activeSessionId,
  onSessionStart,
  isHost = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const managerRef = useRef<WatchTogetherManager | null>(null)
  const syncingFromRemoteRef = useRef(false)
  const lastUpdateTimeRef = useRef(0)
  const updateTimerRef = useRef<NodeJS.Timeout>()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isBuffering, setIsBuffering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState(1)
  const [waitingForGuest, setWaitingForGuest] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "reconnecting">("connected")

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const loadVideo = () => {
      if (src.includes(".m3u8")) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxBufferSize: 60 * 1000 * 1000,
          })

          hlsRef.current = hls
          hls.loadSource(src)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsBuffering(false)
            if (!activeSessionId) {
              video.play().catch(() => setError("Click play to start"))
            }
          })

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setError("Failed to load video")
            }
          })
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src
          setIsBuffering(false)
        }
      } else {
        video.src = src
        setIsBuffering(false)
      }
    }

    loadVideo()

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [src, activeSessionId])

  useEffect(() => {
    if (!activeSessionId) return

    const video = videoRef.current
    if (!video) return

    console.log("[v0] 🎬 Setting up watch session for:", activeSessionId, "isHost:", isHost)

    const manager = new WatchTogetherManager()
    managerRef.current = manager

    // Get initial session state
    manager.getSession(activeSessionId).then((session) => {
      if (session) {
        console.log("[v0] 📊 Initial session state:", {
          participants: session.participants,
          isPlaying: session.isPlaying,
          playbackTime: session.playbackTime,
        })
        setParticipants(session.participants)

        // Only host waits when alone
        if (session.participants === 1 && isHost) {
          console.log("[v0] 👤 Host waiting for guests...")
          setWaitingForGuest(true)
          video.pause()
        }
      }
    })

    let reconnectAttempts = 0
    const maxReconnectAttempts = 5

    const setupSubscription = () => {
      // Subscribe to updates
      manager.subscribe(
        activeSessionId,
        (session: WatchSession) => {
          reconnectAttempts = 0
          setConnectionStatus("connected")

          console.log("[v0] 📡 Received sync update:", {
            participants: session.participants,
            playbackTime: session.playbackTime.toFixed(2),
            isPlaying: session.isPlaying,
            currentVideoTime: video.currentTime.toFixed(2),
            currentlyPlaying: !video.paused,
          })

          setParticipants(session.participants)

          if (session.participants > 1) {
            console.log("[v0] 🎉 Multiple participants detected! Clearing waiting state")
            setWaitingForGuest(false)
          }

          const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current
          if (timeSinceLastUpdate < 300) {
            console.log("[v0] ⏭️ Skipping sync (just sent update", timeSinceLastUpdate, "ms ago)")
            return
          }

          if (syncingFromRemoteRef.current) {
            console.log("[v0] ⏭️ Skipping sync (already syncing from remote)")
            return
          }

          syncingFromRemoteRef.current = true

          if (session.isPlaying && video.paused) {
            console.log("[v0] ▶️ Starting playback (received play command)")
            video.play().catch((err) => {
              console.error("[v0] Play error:", err)
              syncingFromRemoteRef.current = false
            })
          } else if (!session.isPlaying && !video.paused) {
            console.log("[v0] ⏸️ Pausing playback (received pause command)")
            video.pause()
          }

          const timeDiff = Math.abs(video.currentTime - session.playbackTime)
          if (timeDiff > 2.5) {
            console.log(
              "[v0] ⏩ Seeking to:",
              session.playbackTime.toFixed(2),
              "(was at:",
              video.currentTime.toFixed(2),
              ", diff:",
              timeDiff.toFixed(2),
              ")",
            )
            video.currentTime = session.playbackTime
          }

          setTimeout(() => {
            syncingFromRemoteRef.current = false
            console.log("[v0] ✅ Remote sync complete")
          }, 500)
        },
        (error: string) => {
          console.error("[v0] ❌ Subscription error:", error)
          setConnectionStatus("disconnected")

          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
            console.log(
              `[v0] 🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`,
            )
            setConnectionStatus("reconnecting")

            setTimeout(() => {
              console.log("[v0] 🔌 Reconnecting...")
              setupSubscription()
            }, delay)
          } else {
            console.error("[v0] ❌ Max reconnection attempts reached")
            setConnectionStatus("disconnected")
          }
        },
      )
    }

    setupSubscription()

    return () => {
      console.log("[v0] 🧹 Cleaning up watch session")
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
      manager.unsubscribe()
    }
  }, [activeSessionId, isHost])

  const updateSession = () => {
    const video = videoRef.current
    if (!video || !activeSessionId || !managerRef.current) return

    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }

    lastUpdateTimeRef.current = Date.now()
    console.log("[v0] 📤 Sending session update:", {
      time: video.currentTime.toFixed(2),
      playing: !video.paused,
    })
    managerRef.current?.updatePlayback(activeSessionId, video.currentTime, !video.paused)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      if (!syncingFromRemoteRef.current) {
        updateSession()
      }
    }

    const handlePause = () => {
      setIsPlaying(false)
      if (!syncingFromRemoteRef.current) {
        updateSession()
      }
    }

    const handleDurationChange = () => setDuration(video.duration)
    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [activeSessionId])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const time = Number.parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
    updateSession()
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const vol = Number.parseFloat(e.target.value)
    video.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.volume = isMuted ? volume : 0
    setIsMuted(!isMuted)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
  }

  const restart = async () => {
    const video = videoRef.current
    if (!video || !activeSessionId || !managerRef.current) return

    console.log("[v0] Restarting video for all participants")

    video.currentTime = 0

    await managerRef.current.restartSession(activeSessionId)

    video.play()
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  return (
    <div
      className="relative w-full h-full bg-black"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full" onClick={togglePlay} />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40">
          <div className="text-center">
            <p className="text-white text-lg mb-4">{error}</p>
            <button
              onClick={togglePlay}
              className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90"
            >
              Click to Play
            </button>
          </div>
        </div>
      )}

      {waitingForGuest && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-40">
          <div className="text-center space-y-6 px-4">
            <div className="w-16 h-16 mx-auto border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <div className="space-y-6">
              <p className="text-white text-2xl font-semibold">Waiting for guests to join...</p>
              {activeSessionId ? (
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl p-8 max-w-md mx-auto border-2 border-white/30 shadow-2xl">
                  <p className="text-white/90 text-base mb-4 font-medium">Share this code with your friends:</p>
                  <div className="bg-black/40 rounded-2xl p-8 mb-6 border-2 border-white/20 shadow-inner">
                    <p className="text-white text-6xl font-black tracking-[0.5em] font-mono select-all drop-shadow-lg">
                      {activeSessionId}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/50 text-xs mb-2">Or share this link:</p>
                    <p className="text-blue-300 text-xs font-mono break-all select-all px-3 py-2 bg-black/30 rounded-lg">
                      {typeof window !== "undefined" && `${window.location.origin}/watch-guest/${activeSessionId}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-white/60 text-sm">Creating session...</p>
              )}
              <p className="text-white/50 text-sm">The video will start automatically when someone joins</p>
            </div>
          </div>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {activeSessionId && connectionStatus !== "connected" && (
        <div className="absolute top-6 left-6 z-50">
          <div
            className={`px-4 py-2 rounded-full flex items-center gap-2 shadow-lg ${
              connectionStatus === "reconnecting" ? "bg-yellow-500" : "bg-red-500"
            }`}
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">
              {connectionStatus === "reconnecting" ? "Reconnecting..." : "Disconnected"}
            </span>
          </div>
        </div>
      )}

      {activeSessionId && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          {participants > 1 && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-semibold">{participants}</span>
            </div>
          )}
          {isHost && (
            <button
              onClick={restart}
              className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
              title="Restart for everyone"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
            {subtitle && <p className="text-white/80">{subtitle}</p>}
          </div>
          {videoType && videoIdentifier && streamUrl && !activeSessionId && (
            <WatchTogetherDialog
              videoType={videoType}
              videoId={videoIdentifier}
              videoTitle={title}
              streamUrl={streamUrl}
              onSessionStart={(id) => onSessionStart?.(id)}
            />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          <div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-sm text-white/70 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black ml-0.5" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <SkipBack className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => skip(10)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="p-2">
                  {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            <button
              onClick={() => videoRef.current?.requestFullscreen()}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
