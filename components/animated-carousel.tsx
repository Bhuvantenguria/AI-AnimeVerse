"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface CarouselItem {
  id: string
  title: string
  image: string
  rating: number
  genre: string[]
  year: number
  description: string
}

interface AnimatedCarouselProps {
  items: CarouselItem[]
  autoPlay?: boolean
  interval?: number
}

export function AnimatedCarousel({ items, autoPlay = true, interval = 5000 }: AnimatedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!autoPlay || isHovered) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, isHovered, items.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  return (
    <div
      className="relative w-full h-[500px] overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Carousel */}
      <div className="relative w-full h-full">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105",
            )}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-6">
                <div className="max-w-2xl">
                  <div className="animate-slide-in-left">
                    <Badge className="mb-4 animate-bounce-in" style={{ animationDelay: "0.2s" }}>
                      #{index + 1} Trending
                    </Badge>
                    <h2
                      className="text-4xl md:text-6xl font-bold mb-4 text-white animate-slide-in-left"
                      style={{ animationDelay: "0.3s" }}
                    >
                      {item.title}
                    </h2>
                    <div
                      className="flex items-center space-x-4 mb-4 animate-slide-in-left"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-semibold">{item.rating}</span>
                      </div>
                      <span className="text-gray-300">{item.year}</span>
                      <div className="flex space-x-2">
                        {item.genre.slice(0, 2).map((g) => (
                          <Badge key={g} variant="outline" className="text-white border-white/30">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-200 text-lg mb-6 animate-slide-in-left" style={{ animationDelay: "0.5s" }}>
                      {item.description}
                    </p>
                    <div className="flex space-x-4 animate-slide-in-left" style={{ animationDelay: "0.6s" }}>
                      <Button size="lg" className="animate-pulse-glow">
                        <Play className="mr-2 h-5 w-5" />
                        Watch Now
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-white border-white/30 hover:bg-white/10 bg-transparent"
                      >
                        More Info
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white"
        onClick={goToNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75",
            )}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
