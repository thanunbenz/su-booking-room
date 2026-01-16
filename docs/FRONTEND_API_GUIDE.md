# 🌐 Frontend API Integration Guide

คู่มือสำหรับเชื่อม Frontend กับ Backend API

---

## 📋 Table of Contents

1. [Base URL & Configuration](#base-url--configuration)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [TypeScript Types](#typescript-types)
5. [API Client Examples](#api-client-examples)
6. [Error Handling](#error-handling)

---

## 🔧 Base URL & Configuration

### Backend URLs

```typescript
// Development
const API_BASE_URL = 'http://localhost:8000/api/v1'

// Production (update later)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
```

### CORS

Backend อนุญาตให้ Frontend ทุก origin เข้าถึงได้:
- ✅ Origins: `*` (all)
- ✅ Headers: `Origin, Content-Type, Accept, Authorization`
- ✅ Methods: `GET, POST, PUT, DELETE, PATCH, OPTIONS`

---

## 🔐 Authentication

### JWT Token Flow

1. **Login** → รับ `access_token` และ `refresh_token`
2. ส่ง `access_token` ใน Header ทุกครั้งที่เรียก API
3. เมื่อ token หมดอายุ → ใช้ `refresh_token` ขอ token ใหม่

### Authorization Header Format

```
Authorization: Bearer <access_token>
```

### Token Storage (แนะนำ)

```typescript
// Store tokens
localStorage.setItem('access_token', token)
localStorage.setItem('refresh_token', refreshToken)

// Get token
const token = localStorage.getItem('access_token')

// Clear tokens (logout)
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
```

---

## 📡 API Endpoints

### 1. Health Check

```typescript
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### 2. Authentication

#### Login

```typescript
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@silpakorn.edu",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@silpakorn.edu",
      "fullname": "Admin Silpakorn",
      "role": {
        "id": 1,
        "name": "admin"
      },
      "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer"
    }
  }
}
```

**Error Responses:**

401 - Invalid credentials:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

404 - User not found:
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with this email does not exist"
  }
}
```

---

#### Register

```typescript
POST /auth/register
```

**Request Body:**
```json
{
  "email": "teacher@silpakorn.edu",
  "password": "password123",
  "fullname": "อาจารย์สมชาย ใจดี",
  "username": "somchai"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 2,
    "email": "teacher@silpakorn.edu",
    "fullname": "อาจารย์สมชาย ใจดี",
    "role": {
      "id": 3,
      "name": "visitor"
    },
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email already exists"
  }
}
```

---

#### Get Current User

```typescript
GET /auth/me
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "email": "admin@silpakorn.edu",
    "fullname": "Admin Silpakorn",
    "role": {
      "id": 1,
      "name": "admin"
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3. Buildings

#### Get All Buildings

```typescript
GET /buildings
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "building_id": 1,
      "name": "อาคาร 6",
      "location": "มหาวิทยาลัยศิลปากร วิทยาเขตพระราชวังสนามจันทร์",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### Get Building by ID

```typescript
GET /buildings/:id
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "building_id": 1,
    "name": "อาคาร 6",
    "location": "มหาวิทยาลัยศิลปากร วิทยาเขตพระราชวังสนามจันทร์",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### Create Building (Admin Only)

```typescript
POST /buildings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "อาคาร 7",
  "location": "มหาวิทยาลัยศิลปากร วิทยาเขตพระราชวังสนามจันทร์"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Building created successfully",
  "data": {
    "building_id": 2,
    "name": "อาคาร 7",
    "location": "มหาวิทยาลัยศิลปากร วิทยาเขตพระราชวังสนามจันทร์",
    "created_at": "2024-01-15T12:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z"
  }
}
```

---

#### Update Building (Admin Only)

```typescript
PUT /buildings/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "อาคาร 7 (ปรับปรุงใหม่)",
  "location": "มหาวิทยาลัยศิลปากร วิทยาเขตพระราชวังสนามจันทร์"
}
```

---

#### Delete Building (Admin Only)

```typescript
DELETE /buildings/:id
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Building deleted successfully",
  "data": null
}
```

---

### 4. Rooms

#### Get All Rooms

```typescript
GET /rooms
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "room_id": 1,
      "name": "601",
      "building_id": 1,
      "building": {
        "building_id": 1,
        "name": "อาคาร 6",
        "location": "มหาวิทยาลัยศิลปากร"
      },
      "capacity": 50,
      "description": "ห้องบรรยาย มีโปรเจคเตอร์ เครื่องเสียง",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### Get Room by ID

```typescript
GET /rooms/:id
```

---

#### Get Rooms by Building ID

```typescript
GET /buildings/:id/rooms
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "room_id": 1,
      "name": "601",
      "building_id": 1,
      "building": {
        "building_id": 1,
        "name": "อาคาร 6"
      },
      "capacity": 50,
      "description": "ห้องบรรยาย",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### Create Room (Admin Only)

```typescript
POST /rooms
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "602",
  "building_id": 1,
  "capacity": 40,
  "description": "ห้องปฏิบัติการคอมพิวเตอร์"
}
```

---

#### Update Room (Admin Only)

```typescript
PUT /rooms/:id
Authorization: Bearer <token>
```

---

#### Delete Room (Admin Only)

```typescript
DELETE /rooms/:id
Authorization: Bearer <token>
```

---

## 🔤 TypeScript Types

```typescript
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
```

---

## 🚀 API Client Examples

### Using Fetch API

```typescript
// api/client.ts
const API_BASE_URL = 'http://localhost:8000/api/v1'

// Helper function to get token
const getToken = (): string | null => {
  return localStorage.getItem('access_token')
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw error
  }

  return response.json()
}

// === Auth API ===

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<User>> => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return apiCall('/auth/me')
  },
}

// === Building API ===

export const buildingApi = {
  getAll: async (): Promise<ApiResponse<Building[]>> => {
    return apiCall('/buildings')
  },

  getById: async (id: number): Promise<ApiResponse<Building>> => {
    return apiCall(`/buildings/${id}`)
  },

  create: async (data: CreateBuildingRequest): Promise<ApiResponse<Building>> => {
    return apiCall('/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: UpdateBuildingRequest): Promise<ApiResponse<Building>> => {
    return apiCall(`/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/buildings/${id}`, {
      method: 'DELETE',
    })
  },
}

// === Room API ===

export const roomApi = {
  getAll: async (): Promise<ApiResponse<Room[]>> => {
    return apiCall('/rooms')
  },

  getById: async (id: number): Promise<ApiResponse<Room>> => {
    return apiCall(`/rooms/${id}`)
  },

  getByBuildingId: async (buildingId: number): Promise<ApiResponse<Room[]>> => {
    return apiCall(`/buildings/${buildingId}/rooms`)
  },

  create: async (data: CreateRoomRequest): Promise<ApiResponse<Room>> => {
    return apiCall('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: UpdateRoomRequest): Promise<ApiResponse<Room>> => {
    return apiCall(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall(`/rooms/${id}`, {
      method: 'DELETE',
    })
  },
}
```

---

### Using Axios

```typescript
// api/axios-client.ts
import axios, { AxiosError, AxiosInstance } from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/v1'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response.data, // Return only data
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Unauthorized - Clear tokens and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data)
  }
)

export default apiClient

// Usage example:
import apiClient from './api/axios-client'

// Login
const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
  email: 'admin@silpakorn.edu',
  password: 'admin123',
})

// Get buildings
const buildings = await apiClient.get<ApiResponse<Building[]>>('/buildings')

// Create room
const newRoom = await apiClient.post<ApiResponse<Room>>('/rooms', {
  name: '602',
  building_id: 1,
  capacity: 40,
})
```

---

### Using React Query

```typescript
// hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/client'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Save tokens
      localStorage.setItem('access_token', data.data.tokens.access_token)
      localStorage.setItem('refresh_token', data.data.tokens.refresh_token)

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: authApi.getMe,
    retry: false,
  })
}

// hooks/useBuildings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { buildingApi } from '@/api/client'

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: buildingApi.getAll,
  })
}

export function useCreateBuilding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: buildingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
    },
  })
}

// Usage in component:
function LoginPage() {
  const login = useLogin()

  const handleSubmit = async (email: string, password: string) => {
    try {
      const response = await login.mutateAsync({ email, password })
      console.log('Logged in:', response.data.user)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  )
}

function BuildingsPage() {
  const { data, isLoading, error } = useBuildings()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.data.map(building => (
        <div key={building.building_id}>{building.name}</div>
      ))}
    </div>
  )
}
```

---

## ⚠️ Error Handling

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate data (e.g., email exists) |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Error Response Format

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* optional additional info */ }
  }
}
```

### Error Handling Example

```typescript
try {
  const response = await authApi.login({ email, password })
  console.log('Success:', response.data)
} catch (error) {
  const apiError = error as ApiError

  switch (apiError.error.code) {
    case 'INVALID_CREDENTIALS':
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      break
    case 'USER_NOT_FOUND':
      alert('ไม่พบผู้ใช้นี้ในระบบ')
      break
    case 'VALIDATION_ERROR':
      console.error('Validation errors:', apiError.error.details)
      break
    default:
      alert('เกิดข้อผิดพลาด: ' + apiError.error.message)
  }
}
```

---

## 🧪 Testing API with cURL

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@silpakorn.edu","password":"admin123"}'

# Get current user (with token)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get all buildings
curl http://localhost:8000/api/v1/buildings

# Create building (Admin only)
curl -X POST http://localhost:8000/api/v1/buildings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"อาคาร 7","location":"มหาวิทยาลัยศิลปากร"}'
```

---

## 📝 Next Steps

1. **Setup API Client** - สร้าง `api/client.ts` ตามตัวอย่างด้านบน
2. **Create Type Definitions** - Copy TypeScript types ไปใช้
3. **Test Authentication** - ทดสอบ Login/Register ก่อน
4. **Build UI Components** - เริ่มสร้าง components ที่เชื่อมกับ API
5. **Add Error Handling** - จัดการ errors ให้ครบถ้วน

---

## 🚀 Ready to Connect!

Backend API พร้อมให้ Frontend เชื่อมต่อแล้ว:
- ✅ CORS configured
- ✅ JWT authentication ready
- ✅ Role-based authorization
- ✅ Standard response format
- ✅ Error handling

**Base URL:** `http://localhost:8000/api/v1`

**Default Admin Account:**
- Email: `admin@silpakorn.edu`
- Password: `admin123`

---

**Happy Coding! 🎉**
