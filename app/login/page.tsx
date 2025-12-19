"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useXtream } from "@/lib/xtream-context"
import { User, Lock, Sparkles, Tv } from "lucide-react"

const DEFAULT_SERVER_URL = "http://playlist.ideapad.cc"

export default function LoginPage() {
  const router = useRouter()
  const { connect, isConnected } = useXtream()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    connect({
      baseUrl: DEFAULT_SERVER_URL,
      username: formData.username,
      password: formData.password,
    })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-primary/30 via-primary/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-accent/30 via-accent/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.3, 0.6, 0.3],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2,
              }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 mb-6"
            >
              <Tv className="h-10 w-10 text-primary-foreground" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">Connect to amri's network</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="h-12 px-4 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                  <AnimatePresence>
                    {focusedField === "username" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 -z-10 blur-xl"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="h-12 px-4 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                  <AnimatePresence>
                    {focusedField === "password" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 -z-10 blur-xl"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Connect Now
                      </>
                    )}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                </Button>
              </motion.div>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-center text-muted-foreground mt-6"
            >
              Your credentials are stored securely in your browser
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
