import { NextResponse } from "next/server"
import { ZodError } from "zod"

export class ApiHttpError extends Error {
  status: number
  details: unknown

  constructor(message: string, status = 400, details: unknown = null) {
    super(message)
    this.name = "ApiHttpError"
    this.status = status
    this.details = details
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation failed",
        details: error.flatten(),
      },
      { status: 422 }
    )
  }

  if (error instanceof ApiHttpError) {
    return NextResponse.json(
      {
        message: error.message,
        details: error.details,
      },
      { status: error.status }
    )
  }

  if (error instanceof Error) {
    console.error(error)

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : error.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      message: "Internal server error",
    },
    { status: 500 }
  )
}
