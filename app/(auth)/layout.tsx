import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-muted/50 via-background to-background">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
