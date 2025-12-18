"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Send, MessageCircle, X, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ChatMessage {
  id: string
  device_id: string
  username: string | null
  message: string
  created_at: string
}

interface WatchTogetherChatProps {
  sessionId: string
  deviceId: string
}

export function WatchTogetherChat({ sessionId, deviceId }: WatchTogetherChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [username, setUsername] = useState<string>("")
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)
  const [tempUsername, setTempUsername] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const storedUsername = localStorage.getItem("watch-together-username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) {
        console.error("[v0] Failed to load messages:", error)
        return
      }

      setMessages(data || [])
    }

    loadMessages()

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          console.log("[v0] 💬 New chat message received:", newMsg)
          setMessages((prev) => [...prev, newMsg])

          if (!isOpen && newMsg.device_id !== deviceId) {
            setUnreadCount((prev) => prev + 1)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, deviceId, supabase, isOpen])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    if (!username) {
      setShowUsernamePrompt(true)
      return
    }

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      device_id: deviceId,
      username: username,
      message: newMessage.trim(),
    })

    if (error) {
      console.error("[v0] Failed to send message:", error)
      return
    }

    setNewMessage("")
  }

  const saveUsername = () => {
    const trimmedName = tempUsername.trim()
    if (!trimmedName) return

    setUsername(trimmedName)
    localStorage.setItem("watch-together-username", trimmedName)
    setShowUsernamePrompt(false)

    if (newMessage.trim()) {
      sendMessage()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 p-4 bg-gradient-to-r from-zinc-700 to-zinc-800 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-zinc-400" />
          <h3 className="text-white font-semibold">Watch Together Chat</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {showUsernamePrompt && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-zinc-400" />
              <h4 className="text-white font-semibold">Choose Your Display Name</h4>
            </div>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  saveUsername()
                }
              }}
              placeholder="Enter your name..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 mb-4"
              maxLength={20}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowUsernamePrompt(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUsername}
                disabled={!tempUsername.trim()}
                className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/50 text-sm mt-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.device_id === deviceId ? "items-end" : "items-start"}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className={`text-xs font-medium ${msg.device_id === deviceId ? "text-zinc-300" : "text-zinc-400"}`}
                >
                  {msg.username || "Guest"}
                </span>
                <span className="text-xs text-white/40">{formatTime(msg.created_at)}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-2xl max-w-[80%] break-words ${
                  msg.device_id === deviceId ? "bg-white text-black" : "bg-white/10 text-white"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        {username && (
          <div className="flex items-center justify-between mb-2 text-xs text-white/50">
            <span>
              Chatting as: <span className="text-white/70 font-medium">{username}</span>
            </span>
            <button
              onClick={() => {
                setTempUsername(username)
                setShowUsernamePrompt(true)
              }}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Change
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={username ? "Type a message..." : "Set your name to chat..."}
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 resize-none"
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2.5 bg-white text-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
