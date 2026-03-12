import { z } from "zod"

import { AUTH_TOKEN_KEY } from "@/lib/constants"
import { appEnv } from "@/lib/env"

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue>
type RequestMethod = "GET" | "POST" | "PUT" | "DELETE"

interface RequestOptions<TBody, TResponse> {
  path: string
  method: RequestMethod
  body?: TBody
  query?: QueryParams
  schema?: z.ZodType<TResponse>
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status = 500, details: unknown = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

function buildUrl(path: string, query?: QueryParams) {
  const isAbsolute = /^https?:\/\//.test(path)

  const runtimeOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  const base = appEnv.apiBaseUrl || runtimeOrigin
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(isAbsolute ? path : normalizedPath, base)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        return
      }

      url.searchParams.set(key, String(value))
    })
  }

  return url.toString()
}

async function request<TResponse, TBody = unknown>({
  path,
  method,
  body,
  query,
  schema,
}: RequestOptions<TBody, TResponse>) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const raw = await response.text()
  let payload: unknown = null

  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = raw
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? ((payload as { message: string }).message ?? "")
        : `Request failed with status ${response.status}`

    throw new ApiError(message, response.status, payload)
  }

  if (schema) {
    return schema.parse(payload)
  }

  return payload as TResponse
}

export const apiClient = {
  get<TResponse>(
    path: string,
    options?: {
      query?: QueryParams
      schema?: z.ZodType<TResponse>
    }
  ) {
    return request<TResponse>({
      method: "GET",
      path,
      query: options?.query,
      schema: options?.schema,
    })
  },
  post<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: {
      query?: QueryParams
      schema?: z.ZodType<TResponse>
    }
  ) {
    return request<TResponse, TBody>({
      method: "POST",
      path,
      body,
      query: options?.query,
      schema: options?.schema,
    })
  },
  put<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: {
      query?: QueryParams
      schema?: z.ZodType<TResponse>
    }
  ) {
    return request<TResponse, TBody>({
      method: "PUT",
      path,
      body,
      query: options?.query,
      schema: options?.schema,
    })
  },
  delete<TResponse>(
    path: string,
    options?: {
      query?: QueryParams
      schema?: z.ZodType<TResponse>
    }
  ) {
    return request<TResponse>({
      method: "DELETE",
      path,
      query: options?.query,
      schema: options?.schema,
    })
  },
}
