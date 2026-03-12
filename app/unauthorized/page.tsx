import Link from "next/link"
import { ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl items-center justify-center px-4 py-10">
      <div className="w-full space-y-4 rounded-xl border bg-card p-6 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlertIcon className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">Unauthorized Access</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to access this page with your current role.
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Login Again</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

