"use client"

import { useEffect, useRef } from "react"

export function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let scene: any,
      camera: any,
      renderer: any,
      panels: any[] = []

    const init = async () => {
      // Dynamically import Three.js to avoid SSR issues
      const THREE = await import("three")

      // Scene setup
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0)

      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement)
      }

      // Create floating manga panels
      const panelGeometry = new THREE.PlaneGeometry(2, 3)
      const panelMaterials = [
        new THREE.MeshBasicMaterial({
          color: 0x6366f1,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshBasicMaterial({
          color: 0x8b5cf6,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        }),
      ]

      // Create multiple floating panels
      for (let i = 0; i < 8; i++) {
        const panel = new THREE.Mesh(panelGeometry, panelMaterials[i % panelMaterials.length])

        panel.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10)

        panel.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)

        scene.add(panel)
        panels.push(panel)
      }

      camera.position.z = 10

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate)

        // Rotate and float panels
        panels.forEach((panel, index) => {
          panel.rotation.x += 0.005 + index * 0.001
          panel.rotation.y += 0.003 + index * 0.0005
          panel.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01
        })

        renderer.render(scene, camera)
      }

      animate()

      // Handle resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }

    init()

    return () => {
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />
}
