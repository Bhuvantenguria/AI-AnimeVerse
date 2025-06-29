"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Volume2, Star, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface MangaFlipCardProps {
  id: string
  title: string
  image: string
  rating: number
  genre: string[]
  chapters: number
  status: "ongoing" | "completed"
  year: number
  description: string
  className?: string
}

export function MangaFlipCard({
  id,
  title,
  image,
  rating,
  genre,
  chapters,
  status,
  year,
  description,
  className,
}: MangaFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className={cn("manga-flip w-full h-[400px] cursor-pointer", className)}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={cn("manga-flip-inner", isFlipped && "rotate-y-180")}>
        {/* Front Side */}
        <div className="manga-flip-front">
          <div className="relative w-full h-full overflow-hidden rounded-xl border bg-card">
            <Image
              src={image || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Status Badge */}
            <Badge className="absolute top-3 right-3" variant={status === "ongoing" ? "default" : "secondary"}>
              {status === "ongoing" ? "Ongoing" : "Completed"}
            </Badge>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{rating}</span>
                </div>
                <span>{chapters} chapters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="manga-flip-back">
          <div className="w-full h-full p-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl border backdrop-blur-sm">
            <div className="h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xl mb-3 text-gradient">{title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Year:</span>
                    <span className="font-semibold">{year}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Rating:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Status:</span>
                    <Badge variant={status === "ongoing" ? "default" : "secondary"} className="text-xs">
                      {status}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {genre.slice(0, 3).map((g) => (
                    <Badge key={g} variant="outline" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full animate-pulse-glow">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Now
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Volume2 className="mr-1 h-3 w-3" />
                    Listen
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1 h-3 w-3" />
                    Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
