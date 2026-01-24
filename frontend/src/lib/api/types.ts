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
  description: string
  created_at: string
  updated_at: string
}

export interface CreateBuildingRequest {
  name: string
  description: string
}

export interface UpdateBuildingRequest {
  name?: string
  description?: string
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

// === Fixed Schedule Types ===

export interface FixedSchedule {
  schedule_id: number
  room_id: number
  subject: string
  teacher_name: string
  day_of_week: number // 1=Mon, 2=Tue, ..., 7=Sun
  start_time: string // HH:MM or HH:MM:SS
  end_time: string // HH:MM or HH:MM:SS
  semester: string
}

export interface CreateScheduleRequest {
  room_id: number
  subject: string
  teacher_name?: string
  day_of_week: number
  start_time: string
  end_time: string
  semester?: string
}

export interface UpdateScheduleRequest {
  room_id?: number
  subject?: string
  teacher_name?: string
  day_of_week?: number
  start_time?: string
  end_time?: string
  semester?: string
}

export interface BulkCreateScheduleRequest {
  schedules: CreateScheduleRequest[]
}

// === Booking Types ===

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'

export interface Booking {
  booking_id: number
  user_id: number
  room_id: number
  title: string
  detail: string
  equipment_request: string
  booking_date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  status: BookingStatus
  status_note: string
  created_at: string
  updated_at: string
}

export interface CreateBookingRequest {
  room_id: number
  title: string
  detail?: string
  equipment_request?: string
  booking_date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus
  status_note?: string
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
