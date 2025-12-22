"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, Users, Clock, Shield } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserInfo } from "@/lib/xtream-api"

export default function AccountPage() {
  const router = useRouter()
  const { isConnected, api, credentials } = useXtream()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) {
      router.push("/login")
      return
    }

    loadAccountInfo()
  }, [isConnected, api, router])

  async function loadAccountInfo() {
    if (!api) return

    try {
      setLoading(true)
      setError(null)
      const info = await api.getUserInfo()
      console.log("[v0] Loaded user info:", info)
      setUserInfo(info)
    } catch (err) {
      console.error("[v0] Failed to load account info:", err)
      setError("Failed to load account information")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    if (!timestamp || timestamp === "0") return "Never"
    const date = new Date(Number.parseInt(timestamp) * 1000)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDaysRemaining = (timestamp: string) => {
    if (!timestamp || timestamp === "0") return null
    const expDate = new Date(Number.parseInt(timestamp) * 1000)
    const now = new Date()
    const diff = expDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Account Information</h1>
            <p className="text-muted-foreground">View your amri's network subscription details</p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : error ? (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={loadAccountInfo}>Retry</Button>
              </CardContent>
            </Card>
          ) : userInfo ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Subscription Status
                    </CardTitle>
                    <CardDescription>Your account expiration details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${userInfo.status === "Active" ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <span className="text-lg font-semibold">{userInfo.status || "Unknown"}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Expiration Date</div>
                        <div className="text-lg font-semibold">{formatDate(userInfo.exp_date)}</div>
                        {getDaysRemaining(userInfo.exp_date) !== null && (
                          <div
                            className={`text-sm ${getDaysRemaining(userInfo.exp_date)! < 7 ? "text-orange-500" : "text-muted-foreground"}`}
                          >
                            {getDaysRemaining(userInfo.exp_date)! > 0
                              ? `${getDaysRemaining(userInfo.exp_date)} days remaining`
                              : "Expired"}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-500" />
                      Connections
                    </CardTitle>
                    <CardDescription>Active and maximum connections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Active Connections</div>
                        <div className="text-lg font-semibold">{userInfo.active_cons || "0"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Maximum Connections</div>
                        <div className="text-lg font-semibold">{userInfo.max_connections || "1"}</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((Number.parseInt(userInfo.active_cons || "0") / Number.parseInt(userInfo.max_connections || "1")) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-500" />
                      Account Details
                    </CardTitle>
                    <CardDescription>Your account information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Username</div>
                        <div className="text-lg font-semibold">{userInfo.username}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Account Type</div>
                        <div className="text-lg font-semibold">{userInfo.is_trial === "1" ? "Trial" : "Premium"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      Account Created
                    </CardTitle>
                    <CardDescription>When your account was registered</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{formatDate(userInfo.created_at)}</div>
                  </CardContent>
                </Card>
              </div>

              {userInfo.message && (
                <Card>
                  <CardHeader>
                    <CardTitle>Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{userInfo.message}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
