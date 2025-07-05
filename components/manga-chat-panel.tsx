"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Send, 
  MessageCircle, 
  BookOpen, 
  Eye, 
  User, 
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

interface Message {
  id: string
  type: "user" | "assistant"
  message: string
  timestamp: string
  panelNumber?: number
  pageNumber?: number
}

interface MangaChatPanelProps {
  isOpen: boolean
  onClose: () => void
  mangaId: string
  mangaTitle: string
  chapterNumber?: string
  currentPage?: number
  totalPages?: number
}

interface Voice {
  id: string
  name: string
  type: string
  gender: string
  language: string
  description: string
}

interface NarrationRequest {
  requestId: string
  status: string
  audioUrl?: string
  duration?: number
  estimatedTime?: string
  message?: string
}

export function MangaChatPanel({ 
  isOpen, 
  onClose, 
  mangaId, 
  mangaTitle, 
  chapterNumber, 
  currentPage = 1,
  totalPages = 1 
}: MangaChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showNarrationPanel, setShowNarrationPanel] = useState(false)
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("narrator-male")
  const [narrationSpeed, setNarrationSpeed] = useState<number>(1.0)
  const [includeDialogue, setIncludeDialogue] = useState(true)
  const [includeNarration, setIncludeNarration] = useState(true)
  const [narrationRequest, setNarrationRequest] = useState<NarrationRequest | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat session
  useEffect(() => {
    if (isOpen && mangaId && !sessionId) {
      initializeChatSession()
    }
  }, [isOpen, mangaId, chapterNumber])

  // Load available voices
  useEffect(() => {
    if (isOpen) {
      loadVoices()
    }
  }, [isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const initializeChatSession = async () => {
    try {
      setIsLoading(true)
      const response = await api.startMangaChatSession(mangaId, chapterNumber, {
        currentPage,
        totalPages
      })
      
      setSessionId(response.sessionId)
      
      // Add welcome message
      if (response.welcomeMessage) {
        setMessages([
          {
            id: `welcome_${Date.now()}`,
            type: "assistant",
            message: response.welcomeMessage,
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

  const loadVoices = async () => {
    try {
      const response = await api.getAvailableVoices()
      setVoices(response.voices || [])
      setSelectedVoice(response.defaultVoice || "narrator-male")
    } catch (error) {
      console.error("Failed to load voices:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: "user",
      message: inputMessage,
      timestamp: new Date().toISOString(),
      panelNumber: undefined,
      pageNumber: currentPage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await api.sendMangaChatMessage(
        sessionId, 
        inputMessage, 
        undefined, 
        currentPage
      )
      
      const assistantMessage: Message = {
        id: response.id,
        type: "assistant",
        message: response.message,
        timestamp: response.timestamp,
        panelNumber: response.panelNumber,
        pageNumber: response.pageNumber
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: "assistant",
        message: "Sorry, I couldn't process your message. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const requestNarration = async () => {
    if (!chapterNumber) return
    
    try {
      setIsLoading(true)
      const response = await api.requestMangaNarration(mangaId, chapterNumber, {
        voiceType: selectedVoice,
        language: "en",
        speed: narrationSpeed,
        includeDialogue,
        includeNarration
      })
      
      setNarrationRequest(response)
      
      // Add system message about narration
      const systemMessage: Message = {
        id: `narration_${Date.now()}`,
        type: "assistant",
        message: `🎙️ **Narration Request Started**\n\nI'm generating an audio narration for Chapter ${chapterNumber} with ${voices.find(v => v.id === selectedVoice)?.name || 'selected voice'}.\n\n**Settings:**\n• Voice: ${voices.find(v => v.id === selectedVoice)?.name}\n• Speed: ${narrationSpeed}x\n• Include Dialogue: ${includeDialogue ? 'Yes' : 'No'}\n• Include Narration: ${includeNarration ? 'Yes' : 'No'}\n\n${response.message}`,
        timestamp: new Date().toISOString(),
      }
      
      setMessages(prev => [...prev, systemMessage])
    } catch (error) {
      console.error("Failed to request narration:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAudio = () => {
    if (!audioElement) return
    
    if (isPlaying) {
      audioElement.pause()
      setIsPlaying(false)
    } else {
      audioElement.play()
      setIsPlaying(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (message: string) => {
    // Simple markdown-like formatting
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-l border-purple-500/20 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20 bg-black/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 ring-2 ring-purple-400">
              <AvatarFallback className="bg-purple-600 text-white">
                <BookOpen className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-semibold text-sm">{mangaTitle}</h3>
              <p className="text-purple-300 text-xs">
                {chapterNumber ? `Chapter ${chapterNumber}` : 'Manga Discussion'}
                {currentPage && totalPages && ` • Page ${currentPage}/${totalPages}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-purple-300 hover:text-white hover:bg-purple-600/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-purple-500/20 bg-black/20">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNarrationPanel(!showNarrationPanel)}
            className="flex-1 bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Narration
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
          >
            <Eye className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>

      {/* Narration Panel */}
      <AnimatePresence>
        {showNarrationPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-purple-500/20 bg-black/30 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium text-sm">Audio Narration</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNarrationPanel(false)}
                  className="text-purple-300 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-purple-300 text-xs">Voice</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name} ({voice.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-300 text-xs">Speed: {narrationSpeed}x</Label>
                  <Slider
                    value={[narrationSpeed]}
                    onValueChange={(value) => setNarrationSpeed(value[0])}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dialogue"
                      checked={includeDialogue}
                      onCheckedChange={setIncludeDialogue}
                    />
                    <Label htmlFor="dialogue" className="text-purple-300 text-xs">
                      Dialogue
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="narration"
                      checked={includeNarration}
                      onCheckedChange={setIncludeNarration}
                    />
                    <Label htmlFor="narration" className="text-purple-300 text-xs">
                      Narration
                    </Label>
                  </div>
                </div>

                <Button
                  onClick={requestNarration}
                  disabled={isLoading || !chapterNumber}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Narration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.type === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-black/30 text-purple-100 border border-purple-500/20"
                }`}
              >
                {message.type === "assistant" && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    <span className="text-xs text-purple-400">Manga Expert</span>
                  </div>
                )}
                <div 
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.message) }}
                />
                {message.pageNumber && (
                  <div className="text-xs text-purple-400 mt-1">
                    Page {message.pageNumber}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-black/30 text-purple-100 border border-purple-500/20 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-purple-500/20 bg-black/30">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about panels, characters, or story..."
            className="flex-1 bg-black/30 border-purple-500/30 text-white placeholder-purple-400"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-purple-400">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </motion.div>
  )
} 