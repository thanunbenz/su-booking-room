// ===================================
// API Types for SU Booking Room
// ===================================

// === User & Auth Types ===

export interface Role {
  role_id: number
  role_name: 'admin' | 'teacher' | 'visitor'
  description: string
  created_at: string
}

export interface User {
  user_id: number
  role_id: number
  email: string
  fullname: string
  username: string
  role: Role
  created_at: string
  updated_at: string
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
  booking_date: string // YYYY-MM-DD — วันเริ่มจอง
  end_date: string // YYYY-MM-DD — วันสิ้นสุด (inclusive); เท่ากับ booking_date ถ้าจองวันเดียว
  start_time: string // HH:MM
  end_time: string // HH:MM
  status: BookingStatus
  status_note: string
  created_at: string
  updated_at: string
  user?: User // Optional because it's only included when preloaded
  room?: Room // Optional because it's only included when preloaded
}

export interface CreateBookingRequest {
  room_id: number
  title: string
  detail?: string
  equipment_request?: string
  booking_date: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD — omit or equal booking_date for single-day
  start_time: string // HH:MM
  end_time: string // HH:MM
  user_id?: number // Admin only — จองแทนผู้ใช้คนอื่น
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus
  status_note?: string
}

/** Sanitized booking shape returned from /bookings/public-calendar (no user PII). */
export interface PublicCalendarBooking {
  booking_id: number
  room_id: number
  room_name: string
  building_id: number
  title: string
  booking_date: string // YYYY-MM-DD
  end_date: string
  start_time: string
  end_time: string
  status: BookingStatus
}

// === User Management Types ===

export interface CreateUserRequest {
  email: string
  password: string
  fullname: string
  username: string
  role_id: number
}

export interface UpdateUserRequest {
  email?: string
  password?: string
  fullname?: string
  username?: string
  role_id?: number
}

// === Role Management Types ===

export interface CreateRoleRequest {
  role_name: string
  description: string
}

export interface UpdateRoleRequest {
  role_name?: string
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
