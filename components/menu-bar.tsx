"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Home, Film, Tv, Radio, Search } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
  iconColor: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Home",
    href: "/",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <Film className="h-5 w-5" />,
    label: "Movies",
    href: "/movies",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Tv className="h-5 w-5" />,
    label: "Series",
    href: "/series",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <Radio className="h-5 w-5" />,
    label: "Live TV",
    href: "/live",
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: "Search",
    href: "/search",
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-500",
  },
]

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export function MenuBar() {
  const { theme } = useTheme()
  const pathname = usePathname()
  const { availableContent } = useXtream()

  const isDarkTheme = theme === "dark"

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.href === "/" || item.href === "/search") return true
    if (item.href === "/movies") return availableContent.hasMovies
    if (item.href === "/series") return availableContent.hasSeries
    if (item.href === "/live") return availableContent.hasLiveTV
    return true
  })

  return (
    <motion.nav
      className="w-full max-w-full p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className={`absolute -inset-2 bg-gradient-radial from-transparent ${
          isDarkTheme
            ? "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%"
            : "via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90%"
        } to-transparent rounded-3xl z-0 pointer-events-none`}
        variants={navGlowVariants}
      />
      <ul className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 relative z-10">
        {visibleMenuItems.map((item, index) => {
          const isActive = pathname === item.href

          return (
            <motion.li key={item.label} className="relative flex-1 sm:flex-initial">
              <motion.div
                className="block rounded-xl overflow-visible group relative"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
              >
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none"
                  variants={glowVariants}
                  style={{
                    background: item.gradient,
                    opacity: isActive ? 0.5 : 0,
                    borderRadius: "16px",
                  }}
                />
                <Link href={item.href} className="block">
                  <motion.div
                    className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-2 relative z-10 bg-transparent transition-colors rounded-xl ${
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    variants={itemVariants}
                    transition={sharedTransition}
                    style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
                  >
                    <span
                      className={`transition-colors duration-300 ${isActive ? item.iconColor : ""} group-hover:${item.iconColor} text-foreground`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm sm:text-base whitespace-nowrap">{item.label}</span>
                  </motion.div>
                </Link>
                <Link href={item.href} className="block absolute inset-0">
                  <motion.div
                    className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-2 z-10 bg-transparent transition-colors rounded-xl ${
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    variants={backVariants}
                    transition={sharedTransition}
                    style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
                  >
                    <span
                      className={`transition-colors duration-300 ${isActive ? item.iconColor : ""} group-hover:${item.iconColor} text-foreground`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm sm:text-base whitespace-nowrap">{item.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.li>
          )
        })}
      </ul>
    </motion.nav>
  )
}
