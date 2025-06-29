"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/hooks/useWebSocket"
import api from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface Character {
  id: string
  name: string
  avatar: string
  source: {
    title: string
    coverImage: string
  }
}

interface CharacterChatPanelProps {
  character: Character
  isOpen: boolean
  onClose: () => void
}

export function CharacterChatPanel({ character, isOpen, onClose }: CharacterChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { lastMessage, sendMessage: sendWebSocketMessage } = useWebSocket()

  // Initialize chat session
  useEffect(() => {
    if (isOpen && character.id && !sessionId) {
      initializeChatSession()
    }
  }, [isOpen, character.id])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage)
    }
  }, [lastMessage])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const initializeChatSession = async () => {
    try {
      setIsLoading(true)
      const response = await api.startChatSession(character.id)
      setSessionId(response.sessionId)

      // Add welcome message
      if (response.welcomeMessage) {
        setMessages([
          {
            role: "assistant",
            content: response.welcomeMessage,
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error("Failed to start chat session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case "chat_message":
        if (message.sessionId === sessionId) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: message.message,
              timestamp: message.timestamp,
            },
          ])
          setIsLoading(false)

          // Play voice if enabled
          if (isVoiceEnabled) {
            speakMessage(message.message)
          }
        }
        break

      case "chat_error":
        if (message.sessionId === sessionId) {
          setIsLoading(false)
          console.error("Chat error:", message.error)
        }
        break
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      await api.sendMessage(sessionId, inputMessage)
    } catch (error) {
      console.error("Failed to send message:", error)
      setIsLoading(false)
    }
  }

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl border-l border-white/20 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/20 bg-black/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 ring-2 ring-purple-400/50">
                  <AvatarImage src={character.avatar || "/placeholder.svg"} alt={character.name} />
                  <AvatarFallback>{character.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-white">{character.name}</h3>
                  <p className="text-xs text-purple-200">{character.source.title}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`text-white hover:bg-white/10 ${isVoiceEnabled ? "bg-purple-500/30" : ""}`}
              >
                {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Badge variant="secondary" className="bg-purple-500/30 text-purple-100">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Chat
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white border border-white/20"
                    } rounded-2xl px-4 py-2`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/20 bg-black/20">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder={`Chat with ${character.name}...`}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={startListening}
                disabled={isListening || isLoading}
                className={`text-white hover:bg-white/10 ${isListening ? "bg-red-500/30" : ""}`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-purple-200 mt-2 text-center">
              {character.name} knows everything about {character.source.title}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
