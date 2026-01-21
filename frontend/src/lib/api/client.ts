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
