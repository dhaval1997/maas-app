export type UserRole = "COMMUTER" | "VALIDATOR" | "ADMIN" | "SUPER_ADMIN"

export interface User {
  id: string
  name: string
  email: string
  mobile: string
  role: UserRole
  createdAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  mobile: string
  password: string
}

export interface AuthSession {
  token: string
  user: User
}
