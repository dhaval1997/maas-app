import Link from "next/link"
import { SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl items-center justify-center px-4 py-10">
      <div className="w-full space-y-4 rounded-xl border bg-card p-6 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
          <SearchXIcon className="size-5 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are trying to open does not exist or may have been moved.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}

