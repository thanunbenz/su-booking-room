// ===================================
// API Types for SU Booking Room
// ===================================

// === User & Auth Types ===

export interface Role {
  id: number
  name: 'admin' | 'teacher' | 'visitor'
}

export interface User {
  id: number
  email: string
  fullname: string
  role: Role
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullname: string
  username: string
}

export interface LoginResponse {
  user: User
  tokens: {
    access_token: string
    refresh_token: string
    token_type: string
  }
}

// === Building Types ===

export interface Building {
  building_id: number
  name: string
  location: string
  created_at: string
  updated_at: string
}

export interface CreateBuildingRequest {
  name: string
  location: string
}

export interface UpdateBuildingRequest {
  name?: string
  location?: string
}

// === Room Types ===

export interface Room {
  room_id: number
  name: string
  building_id: number
  building?: Building
  capacity: number
  description: string
  created_at: string
  updated_at: string
}

export interface CreateRoomRequest {
  name: string
  building_id: number
  capacity: number
  description?: string
}

export interface UpdateRoomRequest {
  name?: string
  building_id?: number
  capacity?: number
  description?: string
}

// === API Response Types ===

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// === Error Codes ===

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
