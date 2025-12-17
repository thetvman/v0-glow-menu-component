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
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const managerRef = useRef<WatchTogetherManager | null>(null)
  const syncingRef = useRef(false)
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

    const manager = new WatchTogetherManager()
    managerRef.current = manager

    // Get initial session state
    manager.getSession(activeSessionId).then((session) => {
      if (session) {
        setParticipants(session.participants)
        if (session.participants === 1) {
          setWaitingForGuest(true)
          video.pause()
        }
      }
    })

    // Subscribe to updates
    manager.subscribe(activeSessionId, (session: WatchSession) => {
      if (syncingRef.current) return

      console.log("[v0] Sync:", session.participants, "watching,", session.isPlaying ? "playing" : "paused")

      setParticipants(session.participants)

      // Stop waiting when guest joins
      if (session.participants > 1 && waitingForGuest) {
        setWaitingForGuest(false)
      }

      syncingRef.current = true

      // Sync playback state
      if (session.isPlaying && video.paused) {
        video.play()
      } else if (!session.isPlaying && !video.paused) {
        video.pause()
      }

      // Sync time if off by more than 2 seconds
      const timeDiff = Math.abs(video.currentTime - session.playbackTime)
      if (timeDiff > 2) {
        video.currentTime = session.playbackTime
      }

      setTimeout(() => {
        syncingRef.current = false
      }, 500)
    })

    return () => {
      manager.unsubscribe()
    }
  }, [activeSessionId, waitingForGuest])

  const updateSession = () => {
    const video = videoRef.current
    if (!video || !activeSessionId || !managerRef.current || syncingRef.current) return

    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }

    updateTimerRef.current = setTimeout(() => {
      managerRef.current?.updatePlayback(activeSessionId, video.currentTime, !video.paused)
    }, 500)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      updateSession()
    }

    const handlePlay = () => {
      setIsPlaying(true)
      updateSession()
    }

    const handlePause = () => {
      setIsPlaying(false)
      updateSession()
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

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

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

  const restart = () => {
    const video = videoRef.current
    if (!video || !activeSessionId || !managerRef.current) return

    video.currentTime = 0
    video.pause()
    managerRef.current.updatePlayback(activeSessionId, 0, false)
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

  return (
    <div
      className="relative w-full h-full bg-black"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full" onClick={togglePlay} />

      {/* Error overlay */}
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

      {/* Waiting for guest overlay */}
      {waitingForGuest && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-40">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <div>
              <p className="text-white text-xl font-semibold mb-2">Waiting for guests...</p>
              <p className="text-white/70">Share the session code to start watching together</p>
            </div>
          </div>
        </div>
      )}

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Watch together badge and restart button */}
      {activeSessionId && participants > 1 && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white font-semibold">{participants}</span>
          </div>
          <button
            onClick={restart}
            className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
            title="Restart for everyone"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top bar */}
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

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          {/* Progress bar */}
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

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black ml-0.5" />}
              </button>

              {/* Skip buttons */}
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

              {/* Volume */}
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

            {/* Fullscreen */}
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
