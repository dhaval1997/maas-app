import Link from "next/link"
import { ArrowRightIcon, BusIcon, ChartNoAxesColumnIcon, ShieldCheckIcon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const highlights = [
  {
    title: "Unified Transit Pass",
    description: "Buy and use digital passes across bus, metro, and ferry.",
    icon: BusIcon,
  },
  {
    title: "Secure Role-Based Access",
    description:
      "Commuter self-registration with strict admin and super-admin controls.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Operational Analytics",
    description: "Track sales, validations, and user distribution from dashboards.",
    icon: ChartNoAxesColumnIcon,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              MaaS
            </div>
            <span className="text-sm font-medium">City Transit Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </header>

        <main className="py-14">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">
              Mobility-as-a-Service Platform
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Smart Transit Pass Management for Commuters and Operations Teams
            </h1>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Purchase, validate, and monitor multi-modal transport passes with
              role-specific workflows for commuters, validators, admins, and super admins.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="lg">
                <Link href="/register">
                  Create Commuter Account
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.title}>
                  <CardHeader className="space-y-2">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {item.description}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

