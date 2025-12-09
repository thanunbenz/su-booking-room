'use client';

import { FaHome, FaBook, FaTimes } from 'react-icons/fa';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 bg-teal-700 dark:bg-teal-800 text-white w-64 flex flex-col z-50
        transition-transform duration-300 ease-in-out shadow-2xl rounded-r-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-teal-600 dark:border-teal-700">
        <h1 className="text-xl font-medium">ระบบจองห้องเรียน</h1>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none transition-colors"
          aria-label="Close sidebar"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-100 text-teal-700 dark:text-teal-800 rounded-xl shadow font-medium transition-colors"
        >
          <FaHome className="text-lg" />
          <span>หน้าหลัก</span>
        </Link>

        <Link
          href="/booking"
          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-teal-600 dark:hover:bg-teal-700 rounded-lg transition-colors font-medium"
        >
          <FaBook className="text-lg" />
          <span>จองห้องเรียน</span>
        </Link>
      </nav>
    </aside>
  );
}
