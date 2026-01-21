'use client';

import { useAuth } from '@/contexts/AuthContext';
import { withAuth } from '@/lib/withAuth';
import Link from 'next/link';
import { TbUser, TbMail, TbShield, TbCalendar, TbLogout } from 'react-icons/tb';

function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get role badge color
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'teacher':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'visitor':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  // Get role display name
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            โปรไฟล์ของฉัน
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ข้อมูลบัญชีผู้ใช้และการตั้งค่า
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 px-8 py-12 text-center">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <TbUser className="w-12 h-12 text-teal-700 dark:text-teal-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{user.fullname}</h2>
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role.name)}`}
            >
              <TbShield className="w-4 h-4 mr-1.5" />
              {getRoleDisplayName(user.role.name)}
            </span>
          </div>

          {/* Profile Details */}
          <div className="px-8 py-6 space-y-6">
            {/* Email */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center">
                <TbMail className="w-6 h-6 text-teal-700 dark:text-teal-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  อีเมล
                </p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <TbUser className="w-6 h-6 text-blue-700 dark:text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  รหัสผู้ใช้
                </p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  #{user.id}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <TbCalendar className="w-6 h-6 text-purple-700 dark:text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  สมาชิกเมื่อ
                </p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl transition-colors shadow-md"
            >
              กลับสู่หน้าหลัก
            </Link>
            <Link
              href="/logout"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 transition-colors"
            >
              <TbLogout className="w-5 h-5" />
              ออกจากระบบ
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ต้องการความช่วยเหลือ?{' '}
            <Link
              href="/"
              className="text-teal-700 dark:text-teal-500 hover:text-teal-800 dark:hover:text-teal-600 font-medium"
            >
              ติดต่อฝ่ายสนับสนุน
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Export with authentication protection
export default withAuth(ProfilePage);
