export type User = {
  id: string
  email: string
  name: string
  emailVerified?: boolean
  phone?: string
  country?: string
  /** Time-limited URL for profile photo when the server stores an avatar in blob storage. */
  imageUrl?: string
}

export type Session = {
  id: string
  userId: string
  expiresAt: string
}
