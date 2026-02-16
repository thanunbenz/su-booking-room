'use client';

import { useState, useRef, useEffect } from 'react';
import { FaBars, FaUserCircle } from 'react-icons/fa';
import DarkModeToggle from '../auth/DarkModeToggle';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const getRoleDisplayName = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'teacher':
        return 'อาจารย์';
      case 'visitor':
        return 'ผู้เยี่ยมชม';
      default:
        return roleName;
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-teal-700 dark:text-teal-400 text-xl hover:text-teal-900 dark:hover:text-teal-300 focus:outline-none transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <h2 className="text-teal-700 dark:text-teal-400 font-medium truncate max-w-[200px] md:max-w-none">
          จองห้องภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <DarkModeToggle />

        {/* Loading State */}
        {isLoading && (
          <div className="animate-pulse w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        )}

        {/* Not Logged In */}
        {!isLoading && !isAuthenticated && (
          <Link
            href="/login"
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors text-sm font-medium"
          >
            เข้าสู่ระบบ
          </Link>
        )}

        {/* Logged In */}
        {!isLoading && isAuthenticated && user && (
          <>
            {/* User Info - Desktop Only */}
            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.fullname}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getRoleDisplayName(user.role.role_name)}
              </p>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center justify-center text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 focus:outline-none transition-transform hover:scale-105 cursor-pointer"
                aria-label="Profile menu"
              >
                <FaUserCircle className="text-4xl" />
              </button>

              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-30 origin-top-right animate-dropdown-fade-in"
                >
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-700 hover:text-white dark:hover:bg-teal-600 transition-colors border-b border-gray-100 dark:border-gray-700 text-center cursor-pointer"
                    >
                      ผู้ใช้โปรไฟล์
                    </Link>
                    <Link
                      href="/booking"
                      className="block px-4 py-3 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-700 hover:text-white dark:hover:bg-teal-600 transition-colors border-b border-gray-100 dark:border-gray-700 text-center cursor-pointer"
                    >
                      จองห้องเรียน
                    </Link>
                    <Link
                      href="/logout"
                      className="block px-4 py-3 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-700 hover:text-white dark:hover:bg-teal-600 transition-colors text-center cursor-pointer"
                    >
                      ออกจากระบบ
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
