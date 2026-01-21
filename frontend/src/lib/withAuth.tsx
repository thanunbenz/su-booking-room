'use client';

import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Higher-Order Component (HOC) สำหรับป้องกันหน้าที่ต้องการ authentication
 * ถ้ายังไม่ได้ login จะ redirect ไปหน้า /login อัตโนมัติ
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    // Show loading state while checking authentication
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

    // Don't render anything if not authenticated (will redirect)
    if (!isAuthenticated) {
      return null;
    }

    // Render the protected component if authenticated
    return <Component {...props} />;
  };
}
