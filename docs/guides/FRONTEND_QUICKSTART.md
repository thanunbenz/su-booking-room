# 🚀 Frontend Quick Start - เชื่อม Backend ใน 5 นาที

## ✅ Checklist

- [ ] Backend server รันอยู่ที่ `http://localhost:8000`
- [ ] มี default admin account (email: `admin@silpakorn.edu`, password: `admin123`)
- [ ] ตั้งค่า environment variables

---

## 📦 Files ที่ได้สร้างให้แล้ว

```
frontend/
├── .env.example                      # ตัวอย่าง environment variables
├── src/
│   └── lib/
│       └── api/
│           ├── types.ts              # TypeScript types ทั้งหมด
│           ├── client.ts             # API client (fetch-based)
│           └── README.md             # คู่มือการใช้งาน API client
```

---

## 🔧 Setup Steps

### 1. สร้างไฟล์ `.env.local`

```bash
cd frontend
cp .env.example .env.local
```

**แก้ไข `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

### 2. ทดสอบ API Client

สร้างไฟล์ทดสอบ: `frontend/src/app/test-api/page.tsx`

```typescript
'use client'

import { authApi, buildingApi, tokenManager } from '@/lib/api/client'
import { useState } from 'react'

export default function TestAPIPage() {
  const [result, setResult] = useState<string>('')

  // Test Login
  const testLogin = async () => {
    try {
      const response = await authApi.login({
        email: 'admin@silpakorn.edu',
        password: 'admin123',
      })

      // Save tokens
      tokenManager.saveTokens(
        response.data.tokens.access_token,
        response.data.tokens.refresh_token
      )

      setResult('✅ Login Success: ' + JSON.stringify(response.data.user, null, 2))
    } catch (error: any) {
      setResult('❌ Login Failed: ' + JSON.stringify(error, null, 2))
    }
  }

  // Test Get Buildings
  const testBuildings = async () => {
    try {
      const response = await buildingApi.getAll()
      setResult('✅ Buildings: ' + JSON.stringify(response.data, null, 2))
    } catch (error: any) {
      setResult('❌ Buildings Failed: ' + JSON.stringify(error, null, 2))
    }
  }

  // Test Get Current User (requires login)
  const testGetMe = async () => {
    try {
      const response = await authApi.getMe()
      setResult('✅ Current User: ' + JSON.stringify(response.data, null, 2))
    } catch (error: any) {
      setResult('❌ Get Me Failed: ' + JSON.stringify(error, null, 2))
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test Page</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testLogin} style={{ marginRight: '10px' }}>
          Test Login
        </button>
        <button onClick={testBuildings} style={{ marginRight: '10px' }}>
          Test Get Buildings
        </button>
        <button onClick={testGetMe}>
          Test Get Me (login first)
        </button>
      </div>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h3>Result:</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result || 'Click a button to test'}</pre>
      </div>
    </div>
  )
}
```

---

### 3. เปิดหน้าทดสอบ

```bash
# Start frontend (ถ้ายังไม่ได้รัน)
cd frontend
npm run dev
```

เปิดเบราว์เซอร์ไปที่: `http://localhost:3000/test-api`

---

### 4. ทดสอบ API

1. **คลิก "Test Login"** → ควรได้ user data และ tokens กลับมา
2. **คลิก "Test Get Buildings"** → ควรได้ list ของตึก (อาจจะว่างถ้ายังไม่มีข้อมูล)
3. **คลิก "Test Get Me"** → ต้อง login ก่อน ถึงจะได้ข้อมูล user

---

## 🎯 API Endpoints ที่พร้อมใช้งาน

### Public (ไม่ต้อง login)
- ✅ `GET /health` - Health check
- ✅ `POST /auth/login` - Login
- ✅ `POST /auth/register` - Register
- ✅ `GET /buildings` - ดูตึกทั้งหมด
- ✅ `GET /buildings/:id` - ดูตึกตาม ID
- ✅ `GET /rooms` - ดูห้องทั้งหมด
- ✅ `GET /rooms/:id` - ดูห้องตาม ID
- ✅ `GET /buildings/:id/rooms` - ดูห้องในตึก

### Protected (ต้อง login)
- ✅ `GET /auth/me` - ดูข้อมูลตัวเอง

### Admin Only
- ✅ `POST /buildings` - สร้างตึก
- ✅ `PUT /buildings/:id` - แก้ไขตึก
- ✅ `DELETE /buildings/:id` - ลบตึก
- ✅ `POST /rooms` - สร้างห้อง
- ✅ `PUT /rooms/:id` - แก้ไขห้อง
- ✅ `DELETE /rooms/:id` - ลบห้อง

---

## 📚 เอกสารเพิ่มเติม

1. **[FRONTEND_API_GUIDE.md](docs/FRONTEND_API_GUIDE.md)** - คู่มือ API ฉบับเต็m
2. **[frontend/src/lib/api/README.md](frontend/src/lib/api/README.md)** - ตัวอย่างการใช้งาน API Client
3. **[backend/API_TESTING.md](backend/API_TESTING.md)** - คู่มือทดสอบ API ด้วย cURL/Postman
4. **[backend/ROLE_MIDDLEWARE_GUIDE.md](backend/ROLE_MIDDLEWARE_GUIDE.md)** - คู่มือ Role-based Authorization

---

## 🔑 Default Accounts

### Admin Account
```
Email: admin@silpakorn.edu
Password: admin123
Role: Admin (ID: 1)
```

สามารถใช้ account นี้ทดสอบได้เลย!

---

## ⚠️ Common Issues

### 1. CORS Error
**อาการ:** `Access to fetch at 'http://localhost:8000/api/v1/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**แก้ไข:** Backend มี CORS setup อยู่แล้ว (`AllowOrigins: "*"`) ควรใช้ได้ แต่ถ้ายังมีปัญหา:
- ตรวจสอบ backend กำลังรันอยู่หรือไม่
- ตรวจสอบ URL ใน `.env.local` ถูกต้อง

---

### 2. Token Expired
**อาการ:** API return `401 Unauthorized` แม้จะ login แล้ว

**แก้ไข:**
```typescript
// Logout และ login ใหม่
tokenManager.clearTokens()
// Then login again
```

---

### 3. Network Error
**อาการ:** `Failed to fetch` หรือ `net::ERR_CONNECTION_REFUSED`

**แก้ไข:**
- ตรวจสอบ backend รันอยู่หรือไม่: `curl http://localhost:8000/api/v1/health`
- ตรวจสอบ port ถูกต้อง (default: 8000)

---

## 🎨 ตัวอย่าง UI Components

### Login Form

```typescript
'use client'

import { authApi, tokenManager } from '@/lib/api/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@silpakorn.edu')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await authApi.login({ email, password })

      // Save tokens
      tokenManager.saveTokens(
        response.data.tokens.access_token,
        response.data.tokens.refresh_token
      )

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.error?.message || 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">เข้าสู่ระบบ</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">รหัสผ่าน</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  )
}
```

---

### Buildings List

```typescript
'use client'

import { buildingApi } from '@/lib/api/client'
import { useEffect, useState } from 'react'
import type { Building } from '@/lib/api/types'

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await buildingApi.getAll()
        setBuildings(response.data)
      } catch (error) {
        console.error('Failed to fetch buildings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBuildings()
  }, [])

  if (loading) return <div>กำลังโหลด...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ตึกทั้งหมด</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((building) => (
          <div key={building.building_id} className="p-4 border rounded-lg shadow">
            <h2 className="text-xl font-semibold">{building.name}</h2>
            <p className="text-gray-600 mt-2">{building.location}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## ✅ Next Steps

หลังจากทดสอบ API สำเร็จแล้ว:

1. **สร้าง Authentication Context** - จัดการ user state ทั่วทั้ง app
2. **สร้าง Protected Routes** - ป้องกันหน้าที่ต้อง login
3. **Build UI Components** - สร้าง components สำหรับแต่ละ feature
4. **Add React Query (Optional)** - จัดการ state และ caching
5. **Create Forms** - สำหรับ CRUD operations

---

## 🚀 Ready to Build!

Backend API พร้อมแล้ว เริ่มสร้าง Frontend ได้เลย! 🎉

**Default Admin:**
- Email: `admin@silpakorn.edu`
- Password: `admin123`

**API Base URL:** `http://localhost:8000/api/v1`

**มีคำถามหรือติดปัญหา?** ดูเอกสารเพิ่มเติมได้ที่:
- [FRONTEND_API_GUIDE.md](docs/FRONTEND_API_GUIDE.md)
- [frontend/src/lib/api/README.md](frontend/src/lib/api/README.md)
