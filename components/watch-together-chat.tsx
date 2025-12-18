"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Send, MessageCircle, X } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Load username from localStorage or generate one
    const storedUsername = localStorage.getItem("watch-together-username")
    if (storedUsername) {
      setUsername(storedUsername)
    } else {
      const randomName = `Guest${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0")}`
      setUsername(randomName)
      localStorage.setItem("watch-together-username", randomName)
    }
  }, [])

  useEffect(() => {
    // Load initial messages
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

    // Subscribe to new messages
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

          // Increment unread count if chat is closed and message is from someone else
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
    // Auto-scroll to bottom when new messages arrive
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  useEffect(() => {
    // Clear unread count when chat is opened
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      device_id: deviceId,
      username: username || "Guest",
      message: newMessage.trim(),
    })

    if (error) {
      console.error("[v0] Failed to send message:", error)
      return
    }

    setNewMessage("")
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
        className="fixed bottom-24 right-6 z-50 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:scale-110 transition-transform"
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
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Watch Together Chat</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/50 text-sm mt-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.device_id === deviceId ? "items-end" : "items-start"}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className={`text-xs font-medium ${msg.device_id === deviceId ? "text-purple-400" : "text-pink-400"}`}
                >
                  {msg.username || "Guest"}
                </span>
                <span className="text-xs text-white/40">{formatTime(msg.created_at)}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-2xl max-w-[80%] break-words ${
                  msg.device_id === deviceId
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-white/10 text-white"
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
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
