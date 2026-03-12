"use client"

import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/passes": "Pass Catalog",
  "/my-passes": "My Passes",
  "/trips": "Trip History",
  "/validator": "Validation Terminal",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/pass-types": "Pass Type Management",
  "/users": "User Management",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] ?? "Transit Pass System"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 rounded-t-xl border-b bg-background/95 px-3 backdrop-blur-sm">
          <SidebarTrigger />
          <Separator orientation="vertical" className="" />
          <h1 className="text-sm font-medium tracking-tight">{pageTitle}</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-xl bg-gradient-to-b from-muted/40 to-transparent p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
