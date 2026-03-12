import type { User } from "@/types/auth"

export interface UsersResponse {
  users: User[]
}

export interface CreateManagedUserInput {
  name: string
  email: string
  mobile: string
  password: string
  role: "VALIDATOR" | "ADMIN"
}

export interface CreateManagedUserResponse {
  user: User
}

