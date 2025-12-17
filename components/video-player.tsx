"use client"

import { useEffect } from "react"
import { useState } from "react"
import { useRef } from "react"
import type React from "react"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Users, RotateCcw } from "lucide-react"
import { WatchTogetherButton } from "./watch-together-button"
import { WatchSessionManager, type WatchSession } from "@/lib/watch-session-supabase"

interface VideoPlayerProps {
  src: string
  title: string
  subtitle?: string
  onBack?: () => void
  videoType?: "movie" | "series" | "live"
  videoIdentifier?: string
  streamUrl?: string // Added streamUrl prop for guest access
  activeSessionId?: string
  onSessionStart?: (id: string) => void
}

export function VideoPlayer({
  src,
  title,
  subtitle,
  onBack,
  videoType,
  videoIdentifier,
  streamUrl,
  activeSessionId,
  onSessionStart,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const isSyncingRef = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout>()
  const waitingForGuestRef = useRef(false)
  const sessionManagerRef = useRef<WatchSessionManager | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHlsReady, setIsHlsReady] = useState(false)
  const [waitingForGuest, setWaitingForGuest] = useState(false)
  const [participantCount, setParticipantCount] = useState(1)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setIsHlsReady(false)

    const loadHLS = async () => {
      console.log("[v0] Loading video source:", src)
      setError(null)
      setIsBuffering(true)

      if (src.includes(".m3u8")) {
        try {
          if (Hls.isSupported()) {
            console.log("[v0] Using HLS.js for stream playback")

            if (hlsRef.current) {
              hlsRef.current.destroy()
            }

            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 30,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              maxBufferSize: 60 * 1000 * 1000,
              maxBufferHole: 0.5,
              highBufferWatchdogPeriod: 2,
            })

            hlsRef.current = hls

            hls.loadSource(src)
            hls.attachMedia(video)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log("[v0] HLS manifest parsed successfully")
              setIsBuffering(false)
              setIsHlsReady(true)

              if (activeSessionId) {
                console.log("[v0] Session ID provided, starting sync")
                onSessionStart?.(activeSessionId)
              } else if (video.paused) {
                video
                  .play()
                  .then(() => {
                    console.log("[v0] Playback started")
                    setIsPlaying(true)
                    setError(null)
                  })
                  .catch((err) => {
                    console.error("[v0] Autoplay failed:", err)
                    setError("Autoplay was prevented. Click play to start.")
                    setIsPlaying(false)
                  })
              }
            })

            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error("[v0] HLS error:", data)
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.error("[v0] Fatal network error, trying to recover")
                    setError("Network error. Retrying...")
                    hls.startLoad()
                    break
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error("[v0] Fatal media error, trying to recover")
                    setError("Media error. Retrying...")
                    hls.recoverMediaError()
                    break
                  default:
                    console.error("[v0] Fatal error, cannot recover")
                    setError("Failed to load stream. Please try another source.")
                    hls.destroy()
                    break
                }
              }
            })
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            console.log("[v0] Using native HLS support")
            video.src = src
            setIsBuffering(false)
            setIsHlsReady(true)
            if (video.paused) {
              video
                .play()
                .then(() => {
                  setIsPlaying(true)
                  setError(null)
                })
                .catch((err) => {
                  console.error("[v0] Autoplay failed:", err)
                  setError("Autoplay was prevented. Click play to start.")
                  setIsPlaying(false)
                })
            }
          } else {
            console.error("[v0] HLS not supported in this browser")
            setError("HLS streams are not supported in your browser.")
          }
        } catch (err) {
          console.error("[v0] Failed to load HLS.js:", err)
          setError("Failed to initialize video player.")
        }
      } else {
        console.log("[v0] Using standard video source")
        video.src = src
        setIsBuffering(false)
        setIsHlsReady(true)
        if (video.paused) {
          video
            .play()
            .then(() => {
              setIsPlaying(true)
              setError(null)
            })
            .catch((err) => {
              console.error("[v0] Autoplay failed:", err)
              setError("Autoplay was prevented. Click play to start.")
              setIsPlaying(false)
            })
        }
      }
    }

    loadHLS()

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      if (activeSessionId && sessionManagerRef.current && !isSyncingRef.current) {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        updateTimeoutRef.current = setTimeout(() => {
          sessionManagerRef.current?.updatePlaybackState(activeSessionId, video.currentTime, !video.paused)
        }, 1000)
      }
    }

    const handleDurationChange = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      video.currentTime = 0
    }
    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)
    const handlePlay = () => {
      setIsPlaying(true)
      setError(null)

      if (activeSessionId && sessionManagerRef.current && !isSyncingRef.current) {
        console.log("[v0] Local play - updating session")
        sessionManagerRef.current.updatePlaybackState(activeSessionId, video.currentTime, true)
      }
    }
    const handlePause = () => {
      setIsPlaying(false)

      if (activeSessionId && sessionManagerRef.current && !isSyncingRef.current) {
        console.log("[v0] Local pause - updating session")
        sessionManagerRef.current.updatePlaybackState(activeSessionId, video.currentTime, false)
      }
    }
    const handleError = (e: Event) => {
      console.error("[v0] Video element error:", e)
      const videoError = video.error
      if (videoError) {
        console.error("[v0] Video error code:", videoError.code, "message:", videoError.message)
        setError(`Video error: ${videoError.message || "Failed to load video"}`)
      }
      setIsBuffering(false)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)

      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, activeSessionId, onSessionStart])

  useEffect(() => {
    if (!activeSessionId) return

    console.log("[v0] Starting watch together sync for session:", activeSessionId)
    const manager = new WatchSessionManager()
    sessionManagerRef.current = manager

    manager.getSession(activeSessionId).then((session) => {
      if (session) {
        console.log("[v0] Initial session state - participants:", session.participants)
        setParticipantCount(session.participants)
        if (session.participants === 1) {
          console.log("[v0] Host waiting for guests to join...")
          setWaitingForGuest(true)
          const video = videoRef.current
          if (video && !video.paused) {
            video.pause()
            setIsPlaying(false)
          }
        } else {
          console.log("[v0] Joining session with existing participants")
          setWaitingForGuest(false)
        }
      }
    })

    manager.subscribeToSession(activeSessionId, (session: WatchSession) => {
      if (isSyncingRef.current) return

      const video = videoRef.current
      if (!video) return

      console.log(
        "[v0] Received session update - participants:",
        session.participants,
        "isPlaying:",
        session.isPlaying,
        "playbackTime:",
        session.playbackTime,
      )

      setParticipantCount(session.participants)

      if (session.participants > 1 && waitingForGuestRef.current) {
        console.log("[v0] Guest joined! Removing waiting overlay")
        setWaitingForGuest(false)
      }

      isSyncingRef.current = true

      if (session.isPlaying !== !video.paused) {
        console.log("[v0] Syncing play/pause state:", session.isPlaying ? "playing" : "paused")
        if (session.isPlaying) {
          video.play().catch(console.error)
        } else {
          video.pause()
        }
      }

      const timeDiff = Math.abs((video.currentTime || 0) - session.playbackTime)
      if (timeDiff > 2) {
        console.log("[v0] Syncing time difference:", timeDiff)
        video.currentTime = session.playbackTime
      }

      setTimeout(() => {
        isSyncingRef.current = false
      }, 500)
    })

    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.unsubscribe()
        sessionManagerRef.current = null
      }
    }
  }, [activeSessionId])

  useEffect(() => {
    waitingForGuestRef.current = waitingForGuest
  }, [waitingForGuest])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (!isHlsReady && src.includes(".m3u8")) {
      console.log("[v0] HLS not ready yet, waiting...")
      return
    }

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      setError(null)
      video
        .play()
        .then(() => {
          console.log("[v0] Manual play successful")
          setIsPlaying(true)
        })
        .catch((err) => {
          console.error("[v0] Manual play failed:", err)
          setError("Unable to play video. Please try again.")
        })
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const time = Number.parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
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

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(console.error)
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(console.error)
      setIsFullscreen(false)
    }
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
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

  const handleMouseMove = () => {
    setShowControls(true)
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const handleRestartForAll = () => {
    if (!activeSessionId || !sessionManagerRef.current) return

    const video = videoRef.current
    if (!video) return

    console.log("[v0] Host restarting video for all participants")
    video.currentTime = 0
    video.pause()
    setIsPlaying(false)

    sessionManagerRef.current.updatePlaybackState(activeSessionId, 0, false)
  }

  return (
    <div
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full" onClick={togglePlay} />

      {error && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="text-center px-6">
            <p className="text-red-500 text-lg mb-2">Playback Error</p>
            <p className="text-white/70 mb-4">{error}</p>
            <button className="px-6 py-3 bg-primary rounded-full text-white font-medium hover:bg-primary/80 transition-colors flex items-center gap-2 mx-auto">
              <Play className="w-5 h-5" />
              Click to Play
            </button>
          </div>
        </div>
      )}

      {waitingForGuest && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium text-white mb-2">Waiting for guests to join...</p>
              <p className="text-sm text-muted-foreground">Share the session code to start watching together</p>
            </div>
          </div>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {activeSessionId && participantCount > 1 && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-sm text-white font-medium flex items-center gap-2 shadow-lg">
            <Users className="w-4 h-4" />
            <span>{participantCount} watching</span>
          </div>
          <button
            onClick={handleRestartForAll}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-full text-white hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
            title="Restart for everyone"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-0 left-0 right-0 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
              {subtitle && <p className="text-white/70">{subtitle}</p>}
            </div>
            {videoType && videoIdentifier && streamUrl && !activeSessionId && (
              <WatchTogetherButton
                videoUrl={videoIdentifier}
                videoTitle={title}
                videoType={videoType}
                streamUrl={streamUrl}
                onSessionCreated={(id) => onSessionStart?.(id)}
              />
            )}
            {activeSessionId && (
              <div className="px-4 py-2 bg-gradient-to-r from-purple-600/90 to-pink-600/90 border border-purple-400/50 rounded-lg backdrop-blur-sm shadow-lg">
                <p className="text-sm text-white font-medium">
                  Watching Together {participantCount > 1 && `(${participantCount} viewers)`}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(168,85,247,0.6)]
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-sm text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center
                  hover:bg-primary/30 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white fill-white" />
                ) : (
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                )}
              </button>

              <button
                onClick={() => skip(-10)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                  hover:bg-white/20 transition-all"
              >
                <SkipBack className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={() => skip(10)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                  hover:bg-white/20 transition-all"
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>

              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm
                    hover:bg-white/20 transition-all"
                >
                  Back
                </button>
              )}

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                hover:bg-white/20 transition-all"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
