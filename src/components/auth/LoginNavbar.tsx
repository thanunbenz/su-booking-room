'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';

export default function LoginNavbar() {
  const pathname = usePathname();
  const isSignupPage = pathname === '/signup';

  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sm:border-none">
      <h1 className="text-teal-700 dark:text-teal-500 text-lg sm:text-xl font-medium truncate pr-4">
        จองห้องภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร
      </h1>
      <div className="flex items-center gap-3">
        <DarkModeToggle />
        <Link
          href={isSignupPage ? '/login' : '/signup'}
          className="text-teal-700 dark:text-teal-500 text-lg hover:text-teal-800 dark:hover:text-teal-600 font-medium whitespace-nowrap"
        >
          {isSignupPage ? 'Sign in' : 'Sign up'}
        </Link>
      </div>
    </nav>
  );
}
