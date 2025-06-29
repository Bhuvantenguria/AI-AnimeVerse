"use client"

import { useEffect, useRef, useState } from "react"
import { useUser } from "@clerk/nextjs"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketReturn {
  isConnected: boolean
  sendMessage: (message: WebSocketMessage) => void
  lastMessage: WebSocketMessage | null
}

export function useWebSocket(): UseWebSocketReturn {
  const { user } = useUser()
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const connectWebSocket = () => {
      try {
        ws.current = new WebSocket(`${WS_URL}/ws?userId=${user.id}`)

        ws.current.onopen = () => {
          setIsConnected(true)
          console.log("WebSocket connected")
        }

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            setLastMessage(message)
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error)
          }
        }

        ws.current.onclose = () => {
          setIsConnected(false)
          console.log("WebSocket disconnected")

          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000)
        }

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error)
        }
      } catch (error) {
        console.error("Failed to connect WebSocket:", error)
        setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [user?.id])

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }

  return {
    isConnected,
    sendMessage,
    lastMessage,
  }
}
