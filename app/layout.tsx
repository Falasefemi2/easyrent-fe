import type { Metadata } from "next"
import { Geist, Geist_Mono, IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import GlobalNav from "@/components/GlobalNav"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { Providers } from "./providers"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "EasyRent",
  description: "Find affordable houses, apartments, and rental properties in your preferred location with ease.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", ibmPlexSans.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <GlobalNav />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
