'use client';

import { FaHome, FaBook, FaTimes, FaBuilding } from 'react-icons/fa';
import { TbDoor, TbCalendar } from 'react-icons/tb';
import { MdAdminPanelSettings } from 'react-icons/md';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role?.role_name === 'admin';

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 bg-teal-700 dark:bg-teal-800 text-white w-64 flex flex-col z-50
        transition-transform duration-300 ease-in-out shadow-2xl rounded-r-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-teal-600 dark:border-teal-700">
        <h1 className="text-xl font-medium">ระบบจองห้อง</h1>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none transition-colors cursor-pointer"
          aria-label="Close sidebar"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {/* Public Menu Items */}
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-100 text-teal-700 dark:text-teal-800 rounded-xl shadow font-medium transition-colors"
          onClick={onClose}
        >
          <FaHome className="text-lg" />
          <span>หน้าหลัก</span>
        </Link>

        <Link
          href="/booking"
          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-teal-600 dark:hover:bg-teal-700 rounded-lg transition-colors font-medium"
          onClick={onClose}
        >
          <FaBook className="text-lg" />
          <span>จองห้องเรียน</span>
        </Link>

        {/* Authenticated User Menu Items */}
        {isAuthenticated && (
          <Link
            href="/my-bookings"
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-teal-600 dark:hover:bg-teal-700 rounded-lg transition-colors font-medium"
            onClick={onClose}
          >
            <TbCalendar className="text-lg" />
            <span>รายการจองของฉัน</span>
          </Link>
        )}

        {/* Admin Section */}
        {isAuthenticated && isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-2 text-white/70 text-xs font-semibold uppercase tracking-wide">
                <MdAdminPanelSettings className="text-base" />
                <span>จัดการระบบ</span>
              </div>
              <div className="mt-2 border-t border-teal-600 dark:border-teal-700"></div>
            </div>

            <Link
              href="/admin/buildings"
              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-teal-600 dark:hover:bg-teal-700 rounded-lg transition-colors font-medium"
              onClick={onClose}
            >
              <FaBuilding className="text-lg" />
              <span>จัดการตึก</span>
            </Link>

            <Link
              href="/admin/rooms"
              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-teal-600 dark:hover:bg-teal-700 rounded-lg transition-colors font-medium"
              onClick={onClose}
            >
              <TbDoor className="text-lg" />
              <span>จัดการห้องเรียน</span>
            </Link>

            <Link
              href="/admin/schedules"
              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-teal-600 dark:hover:bg-teal-700 rounded-lg transition-colors font-medium"
              onClick={onClose}
            >
              <TbCalendar className="text-lg" />
              <span>จัดการตารางเรียน</span>
            </Link>

            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-teal-600 dark:hover:bg-teal-700 rounded-lg transition-colors font-medium"
              onClick={onClose}
            >
              <FaBook className="text-lg" />
              <span>จัดการการจอง</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
