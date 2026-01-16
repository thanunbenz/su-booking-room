# API Client Usage

## Quick Start

### 1. Setup Environment

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Import API Client

```typescript
import { authApi, buildingApi, roomApi, tokenManager } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/types'
```

## Examples

### Authentication

#### Login

```typescript
'use client'

import { authApi, tokenManager } from '@/lib/api/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await authApi.login({ email, password })

      // Save tokens
      tokenManager.saveTokens(
        response.data.tokens.access_token,
        response.data.tokens.refresh_token
      )

      console.log('Logged in:', response.data.user)
      // Redirect to dashboard
    } catch (error) {
      const apiError = error as ApiError
      alert(apiError.error.message)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  )
}
```

#### Get Current User

```typescript
'use client'

import { authApi } from '@/lib/api/client'
import { useEffect, useState } from 'react'
import type { User } from '@/lib/api/types'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authApi.getMe()
        setUser(response.data)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }

    fetchUser()
  }, [])

  if (!user) return <div>Loading...</div>

  return (
    <div>
      <h1>{user.fullname}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role.name}</p>
    </div>
  )
}
```

#### Logout

```typescript
import { tokenManager } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    tokenManager.clearTokens()
    router.push('/login')
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

---

### Buildings

#### Get All Buildings

```typescript
'use client'

import { buildingApi } from '@/lib/api/client'
import { useEffect, useState } from 'react'
import type { Building } from '@/lib/api/types'

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([])

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await buildingApi.getAll()
        setBuildings(response.data)
      } catch (error) {
        console.error('Failed to fetch buildings:', error)
      }
    }

    fetchBuildings()
  }, [])

  return (
    <div>
      <h1>Buildings</h1>
      <ul>
        {buildings.map((building) => (
          <li key={building.building_id}>
            {building.name} - {building.location}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### Create Building (Admin Only)

```typescript
'use client'

import { buildingApi } from '@/lib/api/client'
import { useState } from 'react'

export default function CreateBuildingForm() {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await buildingApi.create({ name, location })
      console.log('Building created:', response.data)
      // Reset form or redirect
      setName('')
      setLocation('')
    } catch (error) {
      console.error('Failed to create building:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Building Name"
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
      />
      <button type="submit">Create Building</button>
    </form>
  )
}
```

---

### Rooms

#### Get Rooms by Building

```typescript
'use client'

import { roomApi } from '@/lib/api/client'
import { useEffect, useState } from 'react'
import type { Room } from '@/lib/api/types'

export default function BuildingRoomsPage({ buildingId }: { buildingId: number }) {
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await roomApi.getByBuildingId(buildingId)
        setRooms(response.data)
      } catch (error) {
        console.error('Failed to fetch rooms:', error)
      }
    }

    fetchRooms()
  }, [buildingId])

  return (
    <div>
      <h2>Rooms</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room.room_id}>
            {room.name} - Capacity: {room.capacity}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Error Handling

```typescript
import type { ApiError } from '@/lib/api/types'

try {
  await authApi.login({ email, password })
} catch (error) {
  const apiError = error as ApiError

  switch (apiError.error.code) {
    case 'INVALID_CREDENTIALS':
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      break
    case 'USER_NOT_FOUND':
      alert('ไม่พบผู้ใช้นี้ในระบบ')
      break
    case 'UNAUTHORIZED':
      // Redirect to login
      router.push('/login')
      break
    case 'FORBIDDEN':
      alert('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้')
      break
    default:
      alert('เกิดข้อผิดพลาด: ' + apiError.error.message)
  }
}
```

---

## Using with React Query

Install dependencies:

```bash
npm install @tanstack/react-query
```

Setup QueryClient:

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

Create custom hooks:

```typescript
// hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, tokenManager } from '@/lib/api/client'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenManager.saveTokens(
        data.data.tokens.access_token,
        data.data.tokens.refresh_token
      )
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

export function useLogout() {
  const queryClient = useQueryClient()

  return () => {
    tokenManager.clearTokens()
    queryClient.clear()
  }
}
```

Use in components:

```typescript
'use client'

import { useLogin } from '@/hooks/useAuth'

export default function LoginForm() {
  const login = useLogin()

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login.mutateAsync({ email, password })
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(email, password)
    }}>
      {/* Form fields */}
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

---

## Server Components (Next.js 14+)

For server-side data fetching:

```typescript
// app/buildings/page.tsx
import { buildingApi } from '@/lib/api/client'

export default async function BuildingsPage() {
  const response = await buildingApi.getAll()

  return (
    <div>
      <h1>Buildings</h1>
      <ul>
        {response.data.map((building) => (
          <li key={building.building_id}>{building.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Testing

Test with mock data:

```typescript
// __tests__/api.test.ts
import { authApi } from '@/lib/api/client'

// Mock fetch
global.fetch = jest.fn()

describe('Auth API', () => {
  it('should login successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: { id: 1, email: 'test@test.com' },
        tokens: { access_token: 'token', refresh_token: 'refresh' },
      },
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await authApi.login({
      email: 'test@test.com',
      password: 'password',
    })

    expect(result.success).toBe(true)
    expect(result.data.user.email).toBe('test@test.com')
  })
})
```
