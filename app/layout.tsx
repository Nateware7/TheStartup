import type React from "react"
import type { Metadata } from "next"
import { Inter, Sora } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { Navbar } from "@/components/navbar"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { AnimatedBackground } from "@/components/animated-background"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "TextMarket - Digital Marketplace",
  description: "Premium digital marketplace for unique digital assets",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${inter.variable} ${sora.variable} font-sans dark`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AnimatedBackground>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              {children}
              <EnhancedFooter />
            </div>
          </AnimatedBackground>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'