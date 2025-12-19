"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ContentCarouselProps {
  title: string
  children: React.ReactNode
  itemCount: number
  hasMore?: boolean
  loading?: boolean
  onLoadMore?: () => void
  onVisible?: () => void
  actionButton?: React.ReactNode
}

export function ContentCarousel({
  title,
  children,
  itemCount,
  hasMore = false,
  loading = false,
  onLoadMore,
  onVisible,
  actionButton,
}: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    if (!containerRef.current || isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true)
          onVisible?.()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isVisible, onVisible])

  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [itemCount])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      const currentScrollLeft = scrollRef.current.scrollLeft
      const scrollWidth = scrollRef.current.scrollWidth
      const clientWidth = scrollRef.current.clientWidth

      console.log("[v0] Scroll triggered:", {
        direction,
        currentScrollLeft,
        scrollWidth,
        clientWidth,
        hasMore,
        loading,
        itemCount,
      })

      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })

      setTimeout(() => {
        checkScroll()
        if (direction === "right" && scrollRef.current && hasMore && !loading) {
          const newScrollLeft = scrollRef.current.scrollLeft
          const nearEnd = newScrollLeft + clientWidth >= scrollWidth - 50

          console.log("[v0] Checking if should load more:", {
            newScrollLeft,
            nearEnd,
            willLoadMore: nearEnd,
          })

          // Load more when we're near the end OR if we can't scroll further
          if (nearEnd || !canScrollRight) {
            console.log("[v0] Triggering load more for:", title)
            onLoadMore?.()
          }
        }
      }, 100)
    }
  }

  return (
    <div ref={containerRef} className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2 items-center">
          {actionButton}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn("h-8 w-8", !canScrollLeft && "opacity-50")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight && !hasMore}
            className={cn("h-8 w-8", !canScrollRight && !hasMore && "opacity-50")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4" onScroll={checkScroll}>
        {children}
      </div>
    </div>
  )
}
