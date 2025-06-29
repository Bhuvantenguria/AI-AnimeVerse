"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { Palette } from "lucide-react"

const themes = [
  { value: "light", label: "Light", color: "bg-white" },
  { value: "dark", label: "Dark", color: "bg-gray-900" },
  { value: "cyberpunk", label: "Cyberpunk", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { value: "elegant", label: "Elegant", color: "bg-gradient-to-r from-gray-900 to-yellow-600" },
  { value: "otaku", label: "Otaku Pop", color: "bg-gradient-to-r from-red-500 to-blue-500" },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value as any)}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className={`w-4 h-4 rounded-full ${themeOption.color}`} />
            <span>{themeOption.label}</span>
            {theme === themeOption.value && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
