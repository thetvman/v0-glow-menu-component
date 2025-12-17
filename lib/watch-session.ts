export interface WatchSession {
  id: string
  code: string
  hostId: string
  videoUrl: string
  videoTitle: string
  videoType: "movie" | "series" | "live"
  streamUrl: string // Direct stream URL for guests
  currentTime: number
  isPlaying: boolean
  participants: string[]
  createdAt: number
  lastUpdate: number
}

export interface SessionParticipant {
  id: string
  nickname: string
  isHost: boolean
  joinedAt: number
}

// Generate a random 6-digit code
export function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Store sessions in localStorage (will upgrade to real-time service later)
const SESSIONS_KEY = "watch_sessions"
const PARTICIPANT_KEY = "watch_participant"

export function createWatchSession(
  videoUrl: string,
  videoTitle: string,
  videoType: "movie" | "series" | "live",
  streamUrl: string, // Added streamUrl parameter
): WatchSession {
  const code = generateSessionCode()
  const hostId = getOrCreateParticipantId()

  const session: WatchSession = {
    id: `session_${Date.now()}`,
    code,
    hostId,
    videoUrl,
    videoTitle,
    videoType,
    streamUrl, // Store stream URL for guests
    currentTime: 0,
    isPlaying: false,
    participants: [hostId],
    createdAt: Date.now(),
    lastUpdate: Date.now(),
  }

  saveSession(session)
  return session
}

export function joinWatchSession(code: string): WatchSession | null {
  const sessions = getAllSessions()
  const session = sessions.find((s) => s.code === code.toUpperCase())

  if (!session) return null

  const participantId = getOrCreateParticipantId()

  if (!session.participants.includes(participantId)) {
    session.participants.push(participantId)
    session.lastUpdate = Date.now()
    saveSession(session)
  }

  return session
}

export function updateSessionState(
  sessionId: string,
  updates: Partial<Pick<WatchSession, "currentTime" | "isPlaying">>,
): void {
  const sessions = getAllSessions()
  const session = sessions.find((s) => s.id === sessionId)

  if (session) {
    Object.assign(session, updates)
    session.lastUpdate = Date.now()
    saveSession(session)
  }
}

export function getSession(sessionId: string): WatchSession | null {
  const sessions = getAllSessions()
  return sessions.find((s) => s.id === sessionId) || null
}

export function leaveSession(sessionId: string): void {
  const sessions = getAllSessions()
  const session = sessions.find((s) => s.id === sessionId)

  if (session) {
    const participantId = getOrCreateParticipantId()
    session.participants = session.participants.filter((p) => p !== participantId)

    // Delete session if no participants left
    if (session.participants.length === 0) {
      deleteSession(sessionId)
    } else {
      saveSession(session)
    }
  }
}

// Helper functions
function getAllSessions(): WatchSession[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(SESSIONS_KEY)
  if (!stored) return []

  try {
    const sessions: WatchSession[] = JSON.parse(stored)
    // Clean up sessions older than 24 hours
    const validSessions = sessions.filter((s) => Date.now() - s.createdAt < 24 * 60 * 60 * 1000)

    if (validSessions.length !== sessions.length) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(validSessions))
    }

    return validSessions
  } catch {
    return []
  }
}

function saveSession(session: WatchSession): void {
  if (typeof window === "undefined") return

  const sessions = getAllSessions()
  const index = sessions.findIndex((s) => s.id === session.id)

  if (index >= 0) {
    sessions[index] = session
  } else {
    sessions.push(session)
  }

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

function deleteSession(sessionId: string): void {
  if (typeof window === "undefined") return

  const sessions = getAllSessions()
  const filtered = sessions.filter((s) => s.id !== sessionId)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered))
}

function getOrCreateParticipantId(): string {
  if (typeof window === "undefined") return "server"

  let participantId = localStorage.getItem(PARTICIPANT_KEY)

  if (!participantId) {
    participantId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(PARTICIPANT_KEY, participantId)
  }

  return participantId
}
