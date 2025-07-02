import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/components/auth-provider"
import { WebSocketProvider } from "@/components/websocket-provider"
import { QueryProvider } from "@/components/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MangaVerse - Ultimate Anime & Manga Experience",
  description:
    "Discover, read, watch, and chat with your favorite anime and manga characters in the ultimate otaku platform.",
  keywords: ["anime", "manga", "chat", "AI", "characters", "otaku", "weeb"],
  authors: [{ name: "MangaVerse Team" }],
  openGraph: {
    title: "MangaVerse - Ultimate Anime & Manga Experience",
    description: "Discover, read, watch, and chat with your favorite anime and manga characters.",
    type: "website",
    url: "https://mangaverse.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "MangaVerse",
    description: "Ultimate Anime & Manga Experience",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <WebSocketProvider>
                <div className="min-h-screen bg-background">
                  <Navigation />
                  <main className="pt-16">{children}</main>
                  <Toaster />
                </div>
              </WebSocketProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
