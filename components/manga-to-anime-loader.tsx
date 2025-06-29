"use client"

import { useEffect, useRef, useState } from "react"

interface MangaToAnimeLoaderProps {
  progress: number
  isVisible: boolean
}

export function MangaToAnimeLoader({ progress, isVisible }: MangaToAnimeLoaderProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loadingText, setLoadingText] = useState("")

  const loadingMessages = [
    "Analyzing manga panels...",
    "Generating character movements...",
    "Adding voice narration...",
    "Applying anime effects...",
    "Finalizing your preview...",
  ]

  useEffect(() => {
    if (!isVisible) return

    const messageIndex = Math.floor((progress / 100) * loadingMessages.length)
    const currentMessage = loadingMessages[Math.min(messageIndex, loadingMessages.length - 1)]

    // Typewriter effect
    let i = 0
    const typeWriter = () => {
      if (i < currentMessage.length) {
        setLoadingText(currentMessage.slice(0, i + 1))
        i++
        setTimeout(typeWriter, 50)
      }
    }

    setLoadingText("")
    typeWriter()
  }, [progress, isVisible])

  useEffect(() => {
    if (!isVisible || typeof window === "undefined") return

    let scene: any,
      camera: any,
      renderer: any,
      mangaPanels: any[] = []

    const init = async () => {
      const THREE = await import("three")

      // Scene setup
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

      renderer.setSize(400, 400)
      renderer.setClearColor(0x000000, 0)

      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement)
      }

      // Create manga panels in a ring
      const panelGeometry = new THREE.PlaneGeometry(1.5, 2)
      const panelCount = 8
      const radius = 4

      for (let i = 0; i < panelCount; i++) {
        const angle = (i / panelCount) * Math.PI * 2

        // Create gradient material for each panel
        const canvas = document.createElement("canvas")
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext("2d")!

        const gradient = ctx.createLinearGradient(0, 0, 256, 256)
        gradient.addColorStop(0, `hsl(${240 + i * 30}, 70%, 60%)`)
        gradient.addColorStop(1, `hsl(${300 + i * 20}, 80%, 70%)`)

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 256, 256)

        // Add some manga-like patterns
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 2
        for (let j = 0; j < 5; j++) {
          ctx.beginPath()
          ctx.moveTo(Math.random() * 256, Math.random() * 256)
          ctx.lineTo(Math.random() * 256, Math.random() * 256)
          ctx.stroke()
        }

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        })

        const panel = new THREE.Mesh(panelGeometry, material)

        panel.position.x = Math.cos(angle) * radius
        panel.position.z = Math.sin(angle) * radius
        panel.position.y = Math.sin(i * 0.5) * 0.5

        panel.rotation.y = -angle + Math.PI / 2
        panel.rotation.x = Math.sin(i * 0.3) * 0.2

        scene.add(panel)
        mangaPanels.push(panel)
      }

      // Add central glow
      const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.3,
      })
      const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
      scene.add(glowSphere)

      camera.position.z = 8
      camera.position.y = 2

      // Animation loop
      const animate = () => {
        if (!isVisible) return

        requestAnimationFrame(animate)

        // Rotate the entire ring
        mangaPanels.forEach((panel, index) => {
          panel.rotation.y += 0.01
          panel.position.y += Math.sin(Date.now() * 0.001 + index) * 0.002

          // Flip panels occasionally
          if (Math.random() < 0.001) {
            panel.rotation.x += Math.PI
          }
        })

        // Pulse the glow
        glowSphere.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.2)

        renderer.render(scene, camera)
      }

      animate()
    }

    init()

    return () => {
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        {/* 3D Loader */}
        <div className="relative mb-8">
          <div ref={mountRef} className="mx-auto animate-pulse-glow" />

          {/* Progress Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Progress Percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-interactive animate-text-pulse">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-interactive animate-neon-glow">Creating Your Anime Preview</h3>
          <p className="text-lg text-muted-foreground min-h-[1.5rem]">
            {loadingText}
            <span className="animate-pulse">|</span>
          </p>

          {/* Cute Mascot */}
          <div className="mt-8 animate-float">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl">🎬</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              <p className="text-sm text-white">Hang tight, hero! Magic is happening! ✨</p>
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
