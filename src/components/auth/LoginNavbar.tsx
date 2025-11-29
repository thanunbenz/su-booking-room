'use client';

import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

export default function LoginNavbar() {
  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sm:border-none">
      <h1 className="text-teal-700 dark:text-teal-500 text-lg sm:text-xl font-medium truncate pr-4">
        จองห้องภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร
      </h1>
      <div className="flex items-center gap-3">
        <DarkModeToggle />
        <Link
          href="/signup"
          className="text-teal-700 dark:text-teal-500 text-lg hover:text-teal-800 dark:hover:text-teal-600 font-medium whitespace-nowrap"
        >
          Sign up
        </Link>
      </div>
    </nav>
  );
}
