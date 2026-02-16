'use client';

import { useState, useEffect } from 'react';
import { withRole } from '@/lib/withRole';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { bookingApi, roomApi, buildingApi } from '@/lib/api/client';
import { Booking, Room, Building, User, BookingStatus } from '@/lib/api/types';
import { TbCalendar, TbCheck, TbX, TbTrash, TbUser, TbFilter, TbEye, TbClock, TbMapPin } from 'react-icons/tb';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

interface BookingWithUser extends Booking {
  user?: User;
}

function ManageBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRoomId, setFilterRoomId] = useState<number>(0);
  const [filterDate, setFilterDate] = useState<string>('');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    // Only fetch if we have a token (authenticated)
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchData();
    }
  }, [filterStatus, filterRoomId, filterDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      if (filterRoomId) params.room_id = filterRoomId;
      if (filterDate) params.date = filterDate;

      const [bookingsRes, roomsRes, buildingsRes] = await Promise.all([
        bookingApi.getAll(params),
        roomApi.getAll(),
        buildingApi.getAll(),
      ]);

      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
      setBuildings(buildingsRes.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err?.error?.message) {
        setError(`ไม่สามารถโหลดข้อมูลได้: ${err.error.message}`);
      } else if (err?.message) {
        setError(`ไม่สามารถโหลดข้อมูลได้: ${err.message}`);
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    bookingId: number,
    status: BookingStatus,
    statusNote?: string
  ) => {
    try {
      setUpdating(bookingId);
      await bookingApi.updateStatus(bookingId, {
        status,
        status_note: statusNote || '',
      });
      // Refresh bookings
      await fetchData();
      alert('อัพเดทสถานะสำเร็จ');
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถอัพเดทสถานะได้');
    } finally {
      setUpdating(null);
    }
  };

  const handleApprove = async (bookingId: number) => {
    if (!confirm('คุณต้องการอนุมัติการจองนี้หรือไม่?')) return;
    await handleUpdateStatus(bookingId, 'approved', 'อนุมัติโดยแอดมิน');
  };

  const handleReject = async (bookingId: number) => {
    const reason = prompt('เหตุผลในการปฏิเสธ (ถ้ามี):');
    if (reason === null) return; // User cancelled
    await handleUpdateStatus(bookingId, 'rejected', reason || 'ปฏิเสธโดยแอดมิน');
  };

  const handleDelete = async (bookingId: number) => {
    if (!confirm('คุณต้องการลบการจองนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    try {
      setUpdating(bookingId);
      await bookingApi.delete(bookingId);
      await fetchData();
      alert('ลบการจองสำเร็จ');
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถลบการจองได้');
    } finally {
      setUpdating(null);
    }
  };

  const getRoomName = (roomId: number) => {
    const room = rooms.find((r) => r.room_id === roomId);
    return room ? room.name : 'ไม่ระบุ';
  };

  const getBuildingName = (roomId: number) => {
    const room = rooms.find((r) => r.room_id === roomId);
    if (!room) return 'ไม่ระบุ';
    const building = buildings.find((b) => b.building_id === room.building_id);
    return building ? building.name : 'ไม่ระบุ';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: {
        label: 'รอการอนุมัติ',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      },
      approved: {
        label: 'อนุมัติแล้ว',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      },
      rejected: {
        label: 'ปฏิเสธ',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      },
      cancelled: {
        label: 'ยกเลิกแล้ว',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      },
      completed: {
        label: 'เสร็จสิ้น',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // แปลง HH:MM:SS หรือ HH:MM ให้เป็น HH:MM
    if (!timeString) return '';
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 dark:border-teal-500 mb-4"></div>
            <p className="text-gray-700 dark:text-gray-200">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TbCalendar className="text-teal-700 dark:text-teal-500" />
            จัดการการจอง
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการและอนุมัติการจองห้องเรียนทั้งหมด
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TbFilter className="text-teal-700 dark:text-teal-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ตัวกรอง</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                สถานะ
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอการอนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="cancelled">ยกเลิกแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ห้อง
              </label>
              <select
                value={filterRoomId}
                onChange={(e) => setFilterRoomId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={0}>ทั้งหมด</option>
                {rooms.map((room) => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วันที่
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <TbCalendar className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">ไม่พบรายการจองที่ตรงกับการกรอง</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Side - Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {booking.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(booking.status)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {booking.booking_id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <TbUser className="text-teal-700 dark:text-teal-500 text-lg" />
                        <span className="text-sm"><span className="font-semibold">ผู้จอง:</span> {booking.user?.fullname || `User ID ${booking.user_id}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiOutlineOfficeBuilding className="text-purple-600 dark:text-purple-400 text-lg" />
                        <span className="text-sm"><span className="font-semibold">ตึก:</span> {getBuildingName(booking.room_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TbMapPin className="text-orange-600 dark:text-orange-400 text-lg" />
                        <span className="text-sm"><span className="font-semibold">ห้อง:</span> {getRoomName(booking.room_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TbCalendar className="text-green-600 dark:text-green-400 text-lg" />
                        <span className="text-sm"><span className="font-semibold">วันที่:</span> {formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <TbClock className="text-pink-600 dark:text-pink-400 text-lg" />
                        <span className="text-sm">
                          <span className="font-semibold">เวลา:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </span>
                      </div>
                      {booking.detail && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            รายละเอียด: {booking.detail}
                          </p>
                        </div>
                      )}
                      {booking.equipment_request && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            อุปกรณ์ที่ต้องการ: {booking.equipment_request}
                          </p>
                        </div>
                      )}
                      {booking.status_note && (
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            หมายเหตุ: {booking.status_note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {/* View Details Button */}
                    <Link
                      href={`/booking/${booking.booking_id}`}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap justify-center"
                    >
                      <TbEye className="w-4 h-4" />
                      ดูรายละเอียด
                    </Link>

                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(booking.booking_id)}
                          disabled={updating === booking.booking_id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          <TbCheck className="w-4 h-4" />
                          {updating === booking.booking_id ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
                        </button>
                        <button
                          onClick={() => handleReject(booking.booking_id)}
                          disabled={updating === booking.booking_id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          <TbX className="w-4 h-4" />
                          {updating === booking.booking_id ? 'กำลังปฏิเสธ...' : 'ปฏิเสธ'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(booking.booking_id)}
                      disabled={updating === booking.booking_id}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      <TbTrash className="w-4 h-4" />
                      {updating === booking.booking_id ? 'กำลังลบ...' : 'ลบ'}
                    </button>
                  </div>
                </div>

                {/* Footer - Created At */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    จองเมื่อ: {new Date(booking.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withRole(ManageBookingsPage, ['admin']);
