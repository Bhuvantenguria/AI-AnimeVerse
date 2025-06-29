"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { X, Send, Mic, MicOff, Volume2, VolumeX, BookOpen, Lightbulb, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: "user" | "character"
  content: string
  timestamp: Date
  isNarration?: boolean
  emotion?: "happy" | "sad" | "excited" | "confused" | "angry"
}

interface Character {
  id: string
  name: string
  avatar: string
  anime: string
  theme: string
  status: string
  personality: string[]
}

interface CharacterChatPanelProps {
  character: Character
  isOpen: boolean
  onClose: () => void
  onSwitchCharacter: (characterId: string) => void
}

const suggestedTopics = {
  "one-piece": [
    "What happens next in the story?",
    "Tell me about Zoro's backstory",
    "Explain Devil Fruits",
    "Who are the Straw Hat Pirates?",
    "What's the One Piece treasure?",
  ],
  "demon-slayer": [
    "How do breathing techniques work?",
    "Tell me about the Hashira",
    "What are demons?",
    "Explain Tanjiro's journey",
    "Who is Muzan?",
  ],
  naruto: [
    "What are chakra and jutsu?",
    "Tell me about the Nine-Tails",
    "Who are the Hokages?",
    "Explain the ninja villages",
    "What's the story behind Sasuke?",
  ],
}

const characterEmotions = {
  happy: "😊",
  sad: "😢",
  excited: "🤩",
  confused: "🤔",
  angry: "😤",
}

export function CharacterChatPanel({ character, isOpen, onClose, onSwitchCharacter }: CharacterChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "character",
      content: `Hey there! I'm ${character.name} from ${character.anime}! Ready to chat about our adventures? 🏴‍☠️`,
      timestamp: new Date(),
      emotion: "happy",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isNarrationMode, setIsNarrationMode] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isNarrating, setIsNarrating] = useState(false)
  const [narrationProgress, setNarrationProgress] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(
      () => {
        const response = generateCharacterResponse(content, character)
        const characterMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "character",
          content: response.content,
          timestamp: new Date(),
          emotion: response.emotion,
        }

        setMessages((prev) => [...prev, characterMessage])
        setIsTyping(false)

        // Play voice if enabled
        if (isVoiceEnabled) {
          playVoiceResponse(response.content, character.name)
        }
      },
      1000 + Math.random() * 2000,
    )
  }

  const generateCharacterResponse = (userInput: string, char: Character) => {
    const input = userInput.toLowerCase()

    // Check for off-topic questions
    const otherAnimes = ["naruto", "demon slayer", "attack on titan", "dragon ball"]
    const isOffTopic = otherAnimes.some((anime) => input.includes(anime) && !char.anime.toLowerCase().includes(anime))

    if (isOffTopic) {
      return {
        content: `Oi! I'm ${char.name} from ${char.anime}! I can't tell you about other anime worlds - but you can ask their characters instead! 🤷‍♂️`,
        emotion: "confused" as const,
      }
    }

    // Generate contextual responses based on character
    if (char.anime.toLowerCase().includes("one piece")) {
      if (input.includes("devil fruit")) {
        return {
          content:
            "Devil Fruits are amazing! They give you incredible powers but you can't swim anymore. I ate the Gomu Gomu no Mi and became a rubber man! Shishishi! 🍎",
          emotion: "excited" as const,
        }
      }
      if (input.includes("crew") || input.includes("straw hat")) {
        return {
          content:
            "My crew is the best! We have Zoro, Nami, Usopp, Sanji, Chopper, Robin, Franky, Brook, and Jinbe! We're gonna find the One Piece together! 👒",
          emotion: "happy" as const,
        }
      }
    }

    // Default friendly response
    const responses = [
      { content: `That's a great question! Let me think about that... 🤔`, emotion: "happy" as const },
      { content: `Interesting! In our world, things work a bit differently... ✨`, emotion: "excited" as const },
      { content: `You know, that reminds me of an adventure we had! 🌟`, emotion: "happy" as const },
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const playVoiceResponse = (text: string, characterName: string) => {
    // Simulate voice playback with visual feedback
    console.log(`Playing voice for ${characterName}: ${text}`)
    // In real implementation, integrate with ElevenLabs or similar TTS
  }

  const startNarration = () => {
    setIsNarrationMode(true)
    setIsNarrating(true)
    setNarrationProgress(0)

    // Simulate narration progress
    const interval = setInterval(() => {
      setNarrationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsNarrating(false)
          return 100
        }
        return prev + 2
      })
    }, 100)

    const narrationMessage: Message = {
      id: Date.now().toString(),
      type: "character",
      content: `🎭 Starting narration of the current chapter in ${character.name}'s voice! Listen as I bring the story to life...`,
      timestamp: new Date(),
      isNarration: true,
      emotion: "excited",
    }

    setMessages((prev) => [...prev, narrationMessage])
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // Implement speech recognition
  }

  const getThemeStyles = (theme: string) => {
    switch (theme.toLowerCase()) {
      case "pirate":
        return "bg-gradient-to-br from-amber-900/20 to-orange-800/20 border-amber-600/30"
      case "demon-slayer":
        return "bg-gradient-to-br from-red-900/20 to-purple-800/20 border-red-600/30"
      case "ninja":
        return "bg-gradient-to-br from-blue-900/20 to-indigo-800/20 border-blue-600/30"
      default:
        return "bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Chat Panel */}
      <div className="relative ml-auto w-full max-w-md h-full animate-slide-in-right">
        <Card className={cn("h-full rounded-none border-l-2 glass-morphism", getThemeStyles(character.theme))}>
          {/* Header */}
          <div className="p-4 border-b border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Character Avatar with Idle Animation */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50 animate-pulse-glow">
                    <img
                      src={character.avatar || "/placeholder.svg"}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />

                  {/* Emotion Indicator */}
                  {messages.length > 0 && messages[messages.length - 1].type === "character" && (
                    <div className="absolute -top-2 -right-2 text-lg animate-bounce-in">
                      {characterEmotions[messages[messages.length - 1].emotion || "happy"]}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg text-interactive">{character.name}</h3>
                  <p className="text-sm text-muted-foreground">{character.status}</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Character Personality Tags */}
            <div className="flex flex-wrap gap-1 mt-3">
              {character.personality.map((trait, index) => (
                <Badge
                  key={trait}
                  variant="outline"
                  className="text-xs animate-bounce-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-200px)]">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="w-full h-full bg-[url('/placeholder.svg?height=400&width=300')] bg-repeat bg-opacity-5" />
            </div>

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn("flex animate-slide-in-up", message.type === "user" ? "justify-end" : "justify-start")}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-2xl relative",
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-4"
                      : "bg-white/10 backdrop-blur-sm border border-white/20 mr-4",
                    message.isNarration && "border-2 border-accent animate-pulse-glow",
                  )}
                >
                  {message.type === "character" && (
                    <div className="flex items-center space-x-2 mb-2">
                      <img
                        src={character.avatar || "/placeholder.svg"}
                        alt={character.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs font-semibold text-primary">{character.name}</span>
                      {message.isNarration && (
                        <Badge variant="secondary" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Narrating
                        </Badge>
                      )}
                    </div>
                  )}

                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {/* Voice Waveform Animation */}
                  {message.type === "character" && isVoiceEnabled && (
                    <div className="flex items-center space-x-1 mt-2 opacity-50">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 12 + 4}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-slide-in-up">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-2xl mr-4">
                  <div className="flex items-center space-x-2">
                    <img
                      src={character.avatar || "/placeholder.svg"}
                      alt={character.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-xs text-muted-foreground">{character.name} is typing</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Narration Progress */}
            {isNarrating && (
              <div className="bg-accent/20 backdrop-blur-sm border border-accent/30 p-4 rounded-xl animate-pulse-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">🎭 Narrating Chapter</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsNarrating(false)}>
                    <Pause className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-300 animate-pulse"
                    style={{ width: `${narrationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{Math.round(narrationProgress)}% complete</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Topics */}
          {showSuggestions && (
            <div className="p-4 border-t border-white/10 animate-slide-in-up">
              <h4 className="text-sm font-semibold mb-3 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Suggested Topics
              </h4>
              <div className="space-y-2">
                {suggestedTopics[
                  character.anime.toLowerCase().replace(/\s+/g, "-") as keyof typeof suggestedTopics
                ]?.map((topic, index) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 animate-bounce-in interactive-hover bg-transparent"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => {
                      handleSendMessage(topic)
                      setShowSuggestions(false)
                    }}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 backdrop-blur-sm">
            {/* Controls */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={cn("transition-colors", isVoiceEnabled ? "text-green-500" : "text-muted-foreground")}
                >
                  {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNarration}
                  className="text-accent hover:text-accent/80"
                  disabled={isNarrating}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Narrate
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-yellow-500 hover:text-yellow-400"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </div>

            {/* Input Bar */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Chat with ${character.name}...`}
                  className="pr-12 bg-white/10 border-white/20 backdrop-blur-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage(inputValue)
                    }
                  }}
                />

                {/* Voice Input Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8",
                    isListening && "text-red-500 animate-pulse",
                  )}
                  onClick={toggleVoiceInput}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>

              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className="animate-pulse-glow"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
