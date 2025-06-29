"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Plus, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimeCardProps {
  id: string
  title: string
  image: string
  rating: number
  genre: string[]
  episodes: number
  status: "ongoing" | "completed"
  year: number
  className?: string
}

export function AnimeCard({ id, title, image, rating, genre, episodes, status, year, className }: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border transition-all duration-300 card-hover",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Watch
              </Button>
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <Badge className="absolute top-2 right-2" variant={status === "ongoing" ? "default" : "secondary"}>
          {status === "ongoing" ? "Ongoing" : "Completed"}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{year}</span>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{rating}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {genre.slice(0, 2).map((g) => (
            <Badge key={g} variant="outline" className="text-xs">
              {g}
            </Badge>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{episodes} episodes</p>
      </div>
    </div>
  )
}
