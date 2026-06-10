export type UserRole = 'student' | 'tutor' | 'admin'

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

export interface ICourse {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string
  tutorId: string
  tutor?: IUser | null
  thumbnailUrl?: string | null
  price: number
  language: 'english' | 'spanish'
  level: 'beginner' | 'intermediate' | 'advanced'
  modules: IModule[]
  totalDuration: number
  totalLessons: number
  isPublished: boolean
  isActive: boolean
  category: string
  tags: string[]
  enrolledCount: number
  rating: number
  reviewCount: number
  createdAt?: string
  updatedAt?: string
}

export interface IModule {
  title: string
  description?: string
  lessons: ILesson[]
  order: number
}

export interface ILesson {
  title: string
  type: 'video' | 'pdf' | 'quiz' | 'assignment'
  mediaUrl?: string
  duration?: number
  content?: string
  order: number
}

export interface IEnrollment {
  id: string
  studentId: string
  courseId: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'uploaded' | 'verified' | 'rejected'
  paymentAmount: number
  paymentMethod: string
  paymentReceiptUrl?: string | null
  progress: number
  completedLessons: string[]
  startedAt?: string | null
  completedAt?: string | null
  course?: ICourse | null
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
