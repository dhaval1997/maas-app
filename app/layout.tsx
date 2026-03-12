import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { QueryProvider } from "@/components/providers/query-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable
      )}
    >
      <body>
        <TooltipProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster richColors position="top-center" toastOptions={{}} />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
