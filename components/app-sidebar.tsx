"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ClipboardListIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserRoundIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { USER_ROLE_LABELS } from "@/lib/constants"
import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/types/auth"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigationItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    roles: ["COMMUTER", "VALIDATOR", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/passes",
    label: "Pass Catalog",
    icon: TicketIcon,
    roles: ["COMMUTER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/my-passes",
    label: "My Passes",
    icon: WalletCardsIcon,
    roles: ["COMMUTER"],
  },
  {
    href: "/trips",
    label: "Trip History",
    icon: ClipboardListIcon,
    roles: ["COMMUTER"],
  },
  {
    href: "/validator",
    label: "Validator",
    icon: ShieldCheckIcon,
    roles: ["VALIDATOR", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/admin/dashboard",
    label: "Admin Metrics",
    icon: LayoutDashboardIcon,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/users",
    label: "Users",
    icon: UserRoundIcon,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/admin/pass-types",
    label: "Pass Types",
    icon: TicketIcon,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(user.role)
  )

  return (
    <Sidebar collapsible="icon" {...props} variant="inset">
      <SidebarHeader className="">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <TicketIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">City Transit Pass</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    MaaS Prototype
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="dark gap-3">
        <div className="rounded-md border border-sidebar-border/70 p-2 text-xs">
          <div className="flex items-center gap-2">
            <UserRoundIcon className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-muted-foreground">
                {USER_ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        </div>

        <Button
          className="justify-start"
          onClick={() => {
            logout()
            router.replace("/login")
          }}
        >
          <LogOutIcon className="size-4" />
          Logout
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
