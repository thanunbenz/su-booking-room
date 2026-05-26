// ===================================
// API Client for SU Booking Room
// ===================================

import type {
  ApiResponse,
  ApiError,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  Role,
  Building,
  CreateBuildingRequest,
  UpdateBuildingRequest,
  Room,
  CreateRoomRequest,
  UpdateRoomRequest,
  FixedSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  BulkCreateScheduleRequest,
  Booking,
  CreateBookingRequest,
  UpdateBookingStatusRequest,
  PublicCalendarBooking,
  CreateUserRequest,
  UpdateUserRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
} from './types'

// Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Helper function to get token
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw data as ApiError
  }

  return data as ApiResponse<T>
}

// ===================================
// Auth API
// ===================================

export const authApi = {
  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<User>> => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get current user
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    return apiCall('/auth/me')
  },
}

// ===================================
// Building API
// ===================================

export const buildingApi = {
  /**
   * Get all buildings
   */
  getAll: async (): Promise<ApiResponse<Building[]>> => {
    return apiCall('/buildings')
  },

  /**
   * Get building by ID
   */
  getById: async (id: number): Promise<ApiResponse<Building>> => {
    return apiCall(`/buildings/${id}`)
  },

    /**
   * Get building name by ID
   */
  getByNameById: async (id: number): Promise<ApiResponse<Building>> => {
    return apiCall(`/buildings/${id}/name`)
  },

  /**
   * Create new building (Admin only)
   */
  create: async (data: CreateBuildingRequest): Promise<ApiResponse<Building>> => {
    return apiCall('/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update building (Admin only)
   */
  update: async (id: number, data: UpdateBuildingRequest): Promise<ApiResponse<Building>> => {
    return apiCall(`/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete building (Admin only)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/buildings/${id}`, {
      method: 'DELETE',
    })
  },
}

// ===================================
// Room API
// ===================================

export const roomApi = {
  /**
   * Get all rooms
   */
  getAll: async (): Promise<ApiResponse<Room[]>> => {
    return apiCall('/rooms')
  },

  /**
   * Get room by ID
   */
  getById: async (id: number): Promise<ApiResponse<Room>> => {
    return apiCall(`/rooms/${id}`)
  },

  /**
   * Get rooms by building ID
   */
  getByBuildingId: async (buildingId: number): Promise<ApiResponse<Room[]>> => {
    return apiCall(`/buildings/${buildingId}/rooms`)
  },

  /**
   * Get room availability (bookings for a specific room and date)
   */
  getAvailability: async (roomId: number, date?: string): Promise<ApiResponse<Booking[]>> => {
    const queryParams = new URLSearchParams()
    if (date) queryParams.append('date', date)

    const query = queryParams.toString()
    return apiCall(`/rooms/${roomId}/availability${query ? `?${query}` : ''}`)
  },

  /**
   * Create new room (Admin only)
   */
  create: async (data: CreateRoomRequest): Promise<ApiResponse<Room>> => {
    return apiCall('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update room (Admin only)
   */
  update: async (id: number, data: UpdateRoomRequest): Promise<ApiResponse<Room>> => {
    return apiCall(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete room (Admin only)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/rooms/${id}`, {
      method: 'DELETE',
    })
  },
}

// ===================================
// Fixed Schedule API
// ===================================

export const scheduleApi = {
  /**
   * Get all schedules
   */
  getAll: async (params?: {
    room_id?: number
    day_of_week?: number
    semester?: string
  }): Promise<ApiResponse<FixedSchedule[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.room_id) queryParams.append('room_id', params.room_id.toString())
    if (params?.day_of_week) queryParams.append('day_of_week', params.day_of_week.toString())
    if (params?.semester) queryParams.append('semester', params.semester)

    const query = queryParams.toString()
    return apiCall(`/schedules${query ? `?${query}` : ''}`)
  },

  /**
   * Get schedule by ID
   */
  getById: async (id: number): Promise<ApiResponse<FixedSchedule>> => {
    return apiCall(`/schedules/${id}`)
  },

  /**
   * Get schedules by room ID
   */
  getByRoomId: async (
    roomId: number,
    params?: { day_of_week?: number; semester?: string }
  ): Promise<ApiResponse<FixedSchedule[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.day_of_week) queryParams.append('day_of_week', params.day_of_week.toString())
    if (params?.semester) queryParams.append('semester', params.semester)

    const query = queryParams.toString()
    return apiCall(`/rooms/${roomId}/schedules${query ? `?${query}` : ''}`)
  },

  /**
   * Create new schedule (Admin only)
   */
  create: async (data: CreateScheduleRequest): Promise<ApiResponse<FixedSchedule>> => {
    return apiCall('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update schedule (Admin only)
   */
  update: async (
    id: number,
    data: UpdateScheduleRequest
  ): Promise<ApiResponse<FixedSchedule>> => {
    return apiCall(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete schedule (Admin only)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/schedules/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Bulk create schedules (Admin only)
   */
  bulkCreate: async (
    data: BulkCreateScheduleRequest
  ): Promise<ApiResponse<{ schedules: FixedSchedule[]; count: number }>> => {
    return apiCall('/schedules/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ===================================
// Booking API
// ===================================

export const bookingApi = {
  /**
   * Get all bookings (Admin only)
   */
  getAll: async (params?: {
    status?: string
    room_id?: number
    booking_date?: string
    from?: string // YYYY-MM-DD — calendar range query (admin)
    to?: string   // YYYY-MM-DD
  }): Promise<ApiResponse<Booking[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.room_id) queryParams.append('room_id', params.room_id.toString())
    if (params?.booking_date) queryParams.append('booking_date', params.booking_date)
    if (params?.from) queryParams.append('from', params.from)
    if (params?.to) queryParams.append('to', params.to)

    const query = queryParams.toString()
    return apiCall(`/bookings${query ? `?${query}` : ''}`)
  },

  /**
   * Public calendar — no auth, returns only approved bookings with user data stripped.
   * Safe for unauthenticated visitors.
   */
  getPublicCalendar: async (params?: {
    from?: string
    to?: string
    room_id?: number
  }): Promise<ApiResponse<PublicCalendarBooking[]>> => {
    const qp = new URLSearchParams()
    if (params?.from) qp.append('from', params.from)
    if (params?.to) qp.append('to', params.to)
    if (params?.room_id) qp.append('room_id', params.room_id.toString())
    const q = qp.toString()
    const res = await fetch(
      `${API_BASE_URL}/bookings/public-calendar${q ? '?' + q : ''}`
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: { code: 'HTTP_' + res.status, message: res.statusText },
      }))
      throw err as ApiError
    }
    return res.json()
  },

  /**
   * Get my bookings
   */
  getMyBookings: async (): Promise<ApiResponse<Booking[]>> => {
    return apiCall('/bookings/my')
  },

  /**
   * Get booking by ID
   */
  getById: async (id: number): Promise<ApiResponse<Booking>> => {
    return apiCall(`/bookings/${id}`)
  },

  /**
   * Create new booking
   */
  create: async (data: CreateBookingRequest): Promise<ApiResponse<Booking>> => {
    return apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update booking status (Admin only)
   */
  updateStatus: async (
    id: number,
    data: UpdateBookingStatusRequest
  ): Promise<ApiResponse<Booking>> => {
    return apiCall(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Cancel booking (User - own booking only)
   */
  cancel: async (id: number): Promise<ApiResponse<Booking>> => {
    return apiCall(`/bookings/${id}/cancel`, {
      method: 'DELETE',
    })
  },

  /**
   * Request cancellation (Admin) — ขอให้เจ้าของยกเลิก, booking → pending_cancellation
   */
  requestCancellation: async (
    id: number,
    reason: string
  ): Promise<ApiResponse<Booking>> => {
    return apiCall(`/bookings/${id}/cancellation/request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  /**
   * Confirm cancellation (Owner) — ยืนยันยกเลิกตามคำขอแอดมิน, booking → cancelled
   */
  confirmCancellation: async (id: number): Promise<ApiResponse<Booking>> => {
    return apiCall(`/bookings/${id}/cancellation/confirm`, {
      method: 'POST',
    })
  },

  /**
   * Reject cancellation (Owner) — ปฏิเสธคำขอยกเลิก, คืนสถานะเดิม
   */
  rejectCancellation: async (id: number): Promise<ApiResponse<Booking>> => {
    return apiCall(`/bookings/${id}/cancellation/reject`, {
      method: 'POST',
    })
  },

  /**
   * Delete booking (Admin only)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/bookings/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Download a single booking's PDF (Admin only).
   * style = "notice" (door notice, default) or "report" (compact table).
   * showFooter toggles the "พิมพ์เมื่อ..." line.
   */
  downloadPDF: async (
    id: number,
    opts?: { style?: 'notice' | 'report'; showFooter?: boolean }
  ): Promise<Blob> => {
    const token = getToken()
    const params = new URLSearchParams()
    if (opts?.style) params.set('style', opts.style)
    if (opts?.showFooter === false) params.set('footer', '0')
    const qs = params.toString()
    const res = await fetch(
      `${API_BASE_URL}/bookings/${id}/pdf${qs ? '?' + qs : ''}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: { code: 'HTTP_' + res.status, message: res.statusText },
      }))
      throw err as ApiError
    }
    return res.blob()
  },

  /**
   * Download multiple bookings as one PDF (Admin only).
   * Provide either `ids` (explicit selection) or `filter` (same shape as getAll).
   */
  downloadBatchPDF: async (req: {
    ids?: number[]
    filter?: { status?: string; room_id?: number; booking_date?: string }
    style?: 'notice' | 'report'
    showFooter?: boolean
  }): Promise<Blob> => {
    const token = getToken()
    const body: Record<string, unknown> = {}
    if (req.ids && req.ids.length > 0) body.ids = req.ids
    if (req.filter) body.filter = req.filter
    if (req.style) body.style = req.style
    if (req.showFooter === false) body.show_footer = false

    const res = await fetch(`${API_BASE_URL}/bookings/pdf/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: { code: 'HTTP_' + res.status, message: res.statusText },
      }))
      throw err as ApiError
    }
    return res.blob()
  },
}

// ===================================
// User API
// ===================================

export const userApi = {
  /**
   * Get all users (Admin only)
   */
  getAll: async (params?: {
    role_id?: number
    search?: string
  }): Promise<ApiResponse<User[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.role_id) queryParams.append('role_id', params.role_id.toString())
    if (params?.search) queryParams.append('search', params.search)

    const query = queryParams.toString()
    return apiCall(`/users${query ? `?${query}` : ''}`)
  },

  /**
   * Get user by ID (Admin only)
   */
  getById: async (id: number): Promise<ApiResponse<User>> => {
    return apiCall(`/users/${id}`)
  },

  /**
   * Create new user (Admin only)
   */
  create: async (data: CreateUserRequest): Promise<ApiResponse<User>> => {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update user (Admin only)
   */
  update: async (id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete user (Admin only)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    })
  },
}

// ===================================
// Role API
// ===================================

export const roleApi = {
  /**
   * Get all roles
   */
  getAll: async (): Promise<ApiResponse<Role[]>> => {
    return apiCall('/roles')
  },

  /**
   * Get role by ID (Admin only)
   */
  getById: async (id: number): Promise<ApiResponse<Role>> => {
    return apiCall(`/roles/${id}`)
  },

  /**
   * Create new role (Admin only)
   */
  create: async (data: CreateRoleRequest): Promise<ApiResponse<Role>> => {
    return apiCall('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update role (Admin only)
   */
  update: async (id: number, data: UpdateRoleRequest): Promise<ApiResponse<Role>> => {
    return apiCall(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete role (Admin only)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/roles/${id}`, {
      method: 'DELETE',
    })
  },
}

// ===================================
// Token Management
// ===================================

export const tokenManager = {
  /**
   * Save tokens to localStorage
   */
  saveTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  },

  /**
   * Get access token
   */
  getAccessToken: (): string | null => {
    return getToken()
  },

  /**
   * Get refresh token
   */
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refresh_token')
  },

  /**
   * Clear all tokens (logout)
   */
  clearTokens: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}
