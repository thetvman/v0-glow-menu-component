"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { XtreamAPI, type XtreamCredentials } from "./xtream-api"

interface AvailableContent {
  hasMovies: boolean
  hasSeries: boolean
  hasLiveTV: boolean
  isLoading: boolean
}

interface XtreamContextType {
  api: XtreamAPI | null
  isConnected: boolean
  connect: (credentials: XtreamCredentials) => void
  disconnect: () => void
  credentials: XtreamCredentials | null
  availableContent: AvailableContent
}

const XtreamContext = createContext<XtreamContextType | undefined>(undefined)

export function XtreamProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<XtreamAPI | null>(null)
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [availableContent, setAvailableContent] = useState<AvailableContent>({
    hasMovies: false,
    hasSeries: false,
    hasLiveTV: false,
    isLoading: true,
  })

  const checkAvailableContent = async (apiInstance: XtreamAPI) => {
    setAvailableContent((prev) => ({ ...prev, isLoading: true }))

    try {
      const [vodCategories, seriesCategories, liveCategories] = await Promise.all([
        apiInstance.getVodCategories().catch(() => []),
        apiInstance.getSeriesCategories().catch(() => []),
        apiInstance.getLiveCategories().catch(() => []),
      ])

      setAvailableContent({
        hasMovies: vodCategories.length > 0,
        hasSeries: seriesCategories.length > 0,
        hasLiveTV: liveCategories.length > 0,
        isLoading: false,
      })
    } catch (error) {
      console.error("[v0] Failed to check available content:", error)
      setAvailableContent({
        hasMovies: false,
        hasSeries: false,
        hasLiveTV: false,
        isLoading: false,
      })
    }
  }

  const connect = (creds: XtreamCredentials) => {
    const newApi = new XtreamAPI(creds)
    setApi(newApi)
    setCredentials(creds)
    setIsConnected(true)
    localStorage.setItem("xtream_credentials", JSON.stringify(creds))
    checkAvailableContent(newApi)
  }

  const disconnect = () => {
    setApi(null)
    setCredentials(null)
    setIsConnected(false)
    setAvailableContent({
      hasMovies: false,
      hasSeries: false,
      hasLiveTV: false,
      isLoading: false,
    })
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
        checkAvailableContent(newApi)
      } catch (e) {
        console.error("Failed to load saved credentials:", e)
        setAvailableContent((prev) => ({ ...prev, isLoading: false }))
      }
    } else {
      setAvailableContent((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  return (
    <XtreamContext.Provider value={{ api, isConnected, connect, disconnect, credentials, availableContent }}>
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
