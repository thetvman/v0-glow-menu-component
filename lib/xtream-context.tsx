"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { XtreamAPI, type XtreamCredentials } from "./xtream-api"

interface XtreamContextType {
  api: XtreamAPI | null
  isConnected: boolean
  connect: (credentials: XtreamCredentials) => void
  disconnect: () => void
  credentials: XtreamCredentials | null
}

const XtreamContext = createContext<XtreamContextType | undefined>(undefined)

export function XtreamProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<XtreamAPI | null>(null)
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = (creds: XtreamCredentials) => {
    const newApi = new XtreamAPI(creds)
    setApi(newApi)
    setCredentials(creds)
    setIsConnected(true)
    localStorage.setItem("xtream_credentials", JSON.stringify(creds))
  }

  const disconnect = () => {
    setApi(null)
    setCredentials(null)
    setIsConnected(false)
    localStorage.removeItem("xtream_credentials")
  }

  useEffect(() => {
    // Load credentials from localStorage on mount
    const savedCredentials = localStorage.getItem("xtream_credentials")
    if (savedCredentials) {
      try {
        const creds = JSON.parse(savedCredentials)
        const newApi = new XtreamAPI(creds)
        setApi(newApi)
        setCredentials(creds)
        setIsConnected(true)
      } catch (e) {
        console.error("Failed to load saved credentials:", e)
      }
    }
  }, [])

  return (
    <XtreamContext.Provider value={{ api, isConnected, connect, disconnect, credentials }}>
      {children}
    </XtreamContext.Provider>
  )
}

export function useXtream() {
  const context = useContext(XtreamContext)
  if (context === undefined) {
    throw new Error("useXtream must be used within a XtreamProvider")
  }
  return context
}
