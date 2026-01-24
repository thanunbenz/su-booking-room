'use client';

import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type RoleName = 'admin' | 'teacher' | 'visitor';

/**
 * Higher-Order Component (HOC) สำหรับป้องกันหน้าตาม Role
 * ใช้สำหรับหน้าที่ต้องการสิทธิ์เฉพาะ role (เช่น Admin เท่านั้น)
 *
 * @param Component - Component ที่ต้องการป้องกัน
 * @param allowedRoles - Array ของ role ที่อนุญาตให้เข้าถึงได้
 *
 * @example
 * // สำหรับหน้า Admin เท่านั้น
 * export default withRole(ManageBuildingsPage, ['admin']);
 *
 * @example
 * // สำหรับหน้าที่ Teacher และ Admin เข้าได้
 * export default withRole(ViewReportsPage, ['admin', 'teacher']);
 */
export function withRole<P extends object>(
  Component: ComponentType<P>,
  allowedRoles: RoleName[]
): ComponentType<P> {
  return function ProtectedByRole(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          // ยังไม่ได้ login → redirect ไป /login
          router.push('/login');
        } else if (user && !allowedRoles.includes(user.role.name as RoleName)) {
          // Login แล้วแต่ role ไม่ตรง → redirect ไปหน้าหลักพร้อม error
          router.push('/?error=forbidden');
        }
      }
    }, [isAuthenticated, isLoading, user, router]);

    // แสดง loading state ขณะตรวจสอบสิทธิ์
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 dark:border-teal-500 mb-4"></div>
            <p className="text-gray-700 dark:text-gray-200">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        </div>
      );
    }

    // ไม่แสดงอะไรถ้ายังไม่ได้ login หรือ role ไม่ตรง (จะ redirect)
    if (!isAuthenticated || !user || !allowedRoles.includes(user.role.name as RoleName)) {
      return null;
    }

    // แสดง component ถ้าผ่านการตรวจสอบแล้ว
    return <Component {...props} />;
  };
}
