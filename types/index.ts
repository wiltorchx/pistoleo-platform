export type UserRole = 'admin'

export interface IUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  avatarUrl?: string | null
  bio?: string | null
  hourlyRate?: number | null
  password?: string
  emailVerified?: boolean
  emailVerificationToken?: string | null
  emailVerificationExpires?: string | null
  termsAccepted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface IPistoleoBatch {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed'
  createdBy: string
  createdAt?: string
  updatedAt?: string
}

export interface IPistoleoInventory {
  id: string
  batchId: string
  upc: string
  description?: string | null
  expectedQuantity: number
  actualQuantity: number
  status: 'missing' | 'partial' | 'complete' | 'over'
  updatedAt?: string
}

export interface IPistoleoScan {
  id: string
  batchId: string
  upc: string
  userId: string
  scannedAt?: string
}
