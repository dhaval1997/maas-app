import { Spinner } from "@/components/ui/spinner"

export default function AppLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-5" />
    </div>
  )
}

