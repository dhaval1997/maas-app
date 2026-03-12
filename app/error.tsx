"use client"

import Link from "next/link"
import { AlertTriangleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl items-center justify-center px-4 py-10">
      <div className="w-full space-y-4 rounded-xl border bg-card p-6 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

