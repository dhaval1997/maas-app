import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppShell } from "@/components/layout/app-shell"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

