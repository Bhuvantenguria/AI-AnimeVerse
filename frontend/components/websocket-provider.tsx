"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-provider"
import { toast } from "@/hooks/use-toast"

interface WebSocketContextType {
  socket: WebSocket | null
  isConnected: boolean
  sendMessage: (message: any) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"}/ws?userId=${user.id}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      console.log("WebSocket connected")
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log("WebSocket disconnected")
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error)
      }
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [user])

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "chat_message":
        // Handle chat message
        window.dispatchEvent(new CustomEvent("chatMessage", { detail: data }))
        break

      case "achievement_unlocked":
        toast({
          title: "Achievement Unlocked! 🏆",
          description: `You've unlocked: ${data.achievement.name}`,
        })
        break

      case "narration_completed":
        toast({
          title: "Narration Ready! 🎵",
          description: "Your AI narration is ready to listen!",
        })
        break

      case "preview_completed":
        toast({
          title: "Preview Ready! 🎬",
          description: "Your manga-to-anime preview is ready!",
        })
        break

      default:
        console.log("Unknown WebSocket message:", data)
    }
  }

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message))
    }
  }

  return <WebSocketContext.Provider value={{ socket, isConnected, sendMessage }}>{children}</WebSocketContext.Provider>
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}
