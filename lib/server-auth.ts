import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"

const KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) {
    return false
  }

  const incoming = scryptSync(password, salt, KEY_LENGTH)
  const existing = Buffer.from(hash, "hex")

  if (incoming.length !== existing.length) {
    return false
  }

  return timingSafeEqual(incoming, existing)
}

export function generateAuthToken() {
  return `${randomUUID().replace(/-/g, "")}${randomBytes(16).toString("hex")}`
}

export function getBearerToken(request: Request) {
  const value = request.headers.get("authorization")
  if (!value) {
    return null
  }

  const [type, token] = value.split(" ")
  if (type !== "Bearer" || !token) {
    return null
  }

  return token
}

