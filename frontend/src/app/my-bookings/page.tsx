'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { withRole } from '@/lib/withRole';
import MainLayout from '@/components/layout/MainLayout';
import { bookingApi, roomApi, buildingApi } from '@/lib/api/client';
import { Booking, Room, Building } from '@/lib/api/types';
import { TbCalendar, TbClock, TbMapPin, TbX, TbEye, TbLayoutGrid } from 'react-icons/tb';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

// Group bookings by group_id for display
interface BookingDisplayItem {
  type: 'single' | 'group';
  booking?: Booking;
  groupId?: number;
  bookings?: Booking[];
  createdAt: string;
}

function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancellingGroup, setCancellingGroup] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [bookingsRes, roomsRes, buildingsRes] = await Promise.all([
        bookingApi.getMyBookings(),
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

  const handleCancel = async (bookingId: number) => {
    if (!confirm('คุณต้องการยกเลิกการจองนี้หรือไม่?')) {
      return;
    }

    try {
      setCancelling(bookingId);
      await bookingApi.cancel(bookingId);
      const bookingsRes = await bookingApi.getMyBookings();
      setBookings(bookingsRes.data);
      alert('ยกเลิกการจองสำเร็จ');
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถยกเลิกการจองได้');
    } finally {
      setCancelling(null);
    }
  };

  const handleCancelGroup = async (groupId: number) => {
    if (!confirm('คุณต้องการยกเลิกการจองทั้งกลุ่มนี้หรือไม่? (ทุกห้องในกลุ่มจะถูกยกเลิก)')) {
      return;
    }

    try {
      setCancellingGroup(groupId);
      await bookingApi.cancelGroup(groupId);
      const bookingsRes = await bookingApi.getMyBookings();
      setBookings(bookingsRes.data);
      alert('ยกเลิกการจองกลุ่มสำเร็จ');
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถยกเลิกการจองกลุ่มได้');
    } finally {
      setCancellingGroup(null);
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
    if (!timeString) return '';
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  // Organize bookings: group by group_id, keep singles separate
  const getDisplayItems = (): BookingDisplayItem[] => {
    const filtered = bookings.filter((booking) => {
      if (filterStatus === 'all') return true;
      return booking.status === filterStatus;
    });

    const groupMap = new Map<number, Booking[]>();
    const singles: Booking[] = [];

    for (const booking of filtered) {
      if (booking.group_id) {
        const existing = groupMap.get(booking.group_id) || [];
        existing.push(booking);
        groupMap.set(booking.group_id, existing);
      } else {
        singles.push(booking);
      }
    }

    const items: BookingDisplayItem[] = [];

    // Add grouped bookings
    groupMap.forEach((groupBookings, groupId) => {
      items.push({
        type: 'group',
        groupId,
        bookings: groupBookings,
        createdAt: groupBookings[0].created_at,
      });
    });

    // Add single bookings
    for (const booking of singles) {
      items.push({
        type: 'single',
        booking,
        createdAt: booking.created_at,
      });
    }

    // Sort by created_at descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return items;
  };

  const displayItems = getDisplayItems();

  const hasActiveBookingInGroup = (groupBookings: Booking[]) => {
    return groupBookings.some((b) => b.status === 'pending' || b.status === 'approved');
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

  // Render a single booking card (used for both standalone and within groups)
  const renderBookingCard = (booking: Booking, isGroupChild: boolean = false) => (
    <div
      key={booking.booking_id}
      className={`${
        isGroupChild
          ? 'p-4 border border-gray-100 dark:border-gray-700 rounded-lg'
          : 'bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left Side - Booking Info */}
        <div className="flex-1">
          {!isGroupChild && (
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {booking.title}
                </h3>
                {getStatusBadge(booking.status)}
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600 dark:text-gray-300 ${isGroupChild ? '' : ''}`}>
            <div className="flex items-center gap-2">
              <HiOutlineOfficeBuilding className="text-purple-600 dark:text-purple-400 text-lg flex-shrink-0" />
              <span className="text-sm"><span className="font-semibold">ตึก:</span> {getBuildingName(booking.room_id)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TbMapPin className="text-orange-600 dark:text-orange-400 text-lg flex-shrink-0" />
              <span className="text-sm"><span className="font-semibold">ห้อง:</span> {getRoomName(booking.room_id)}</span>
            </div>
            {!isGroupChild && (
              <>
                <div className="flex items-center gap-2">
                  <TbCalendar className="text-green-600 dark:text-green-400 text-lg flex-shrink-0" />
                  <span className="text-sm"><span className="font-semibold">วันที่:</span> {formatDate(booking.booking_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TbClock className="text-pink-600 dark:text-pink-400 text-lg flex-shrink-0" />
                  <span className="text-sm">
                    <span className="font-semibold">เวลา:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </span>
                </div>
              </>
            )}
          </div>

          {!isGroupChild && booking.detail && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="font-semibold">รายละเอียด:</span> {booking.detail}
              </p>
            </div>
          )}
          {!isGroupChild && booking.equipment_request && (
            <div className="mt-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="font-semibold">อุปกรณ์ที่ต้องการ:</span> {booking.equipment_request}
              </p>
            </div>
          )}
          {!isGroupChild && booking.status_note && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="font-semibold">หมายเหตุสถานะ:</span> {booking.status_note}
              </p>
            </div>
          )}

          {isGroupChild && (
            <div className="mt-2 flex items-center gap-2">
              {getStatusBadge(booking.status)}
            </div>
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex lg:flex-col gap-2">
          <Link
            href={`/booking/${booking.booking_id}`}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap justify-center text-sm"
          >
            <TbEye className="w-4 h-4" />
            ดูรายละเอียด
          </Link>

          {!isGroupChild && (booking.status === 'pending' || booking.status === 'approved') && (
            <button
              onClick={() => handleCancel(booking.booking_id)}
              disabled={cancelling === booking.booking_id}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap text-sm"
            >
              <TbX className="w-4 h-4" />
              {cancelling === booking.booking_id ? 'กำลังยกเลิก...' : 'ยกเลิก'}
            </button>
          )}
        </div>
      </div>

      {/* Footer - Created At (only for standalone) */}
      {!isGroupChild && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            จองเมื่อ: {new Date(booking.created_at).toLocaleString('th-TH')}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TbCalendar className="text-teal-700 dark:text-teal-500" />
            รายการจองของฉัน
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ดูรายการจองห้องเรียนทั้งหมดของคุณ
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            กรองตามสถานะ
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอการอนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
            <option value="completed">เสร็จสิ้น</option>
          </select>
        </div>

        {/* Bookings List */}
        {displayItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <TbCalendar className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {filterStatus === 'all' ? 'ยังไม่มีรายการจอง' : 'ไม่พบรายการจองที่ตรงกับการกรอง'}
            </p>
            <button
              onClick={() => router.push('/booking')}
              className="mt-4 px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors"
            >
              จองห้องเรียน
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayItems.map((item) => {
              if (item.type === 'single' && item.booking) {
                return renderBookingCard(item.booking);
              }

              if (item.type === 'group' && item.bookings && item.groupId) {
                const firstBooking = item.bookings[0];
                return (
                  <div
                    key={`group-${item.groupId}`}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Group Header */}
                    <div className="bg-teal-50 dark:bg-teal-900/20 border-b border-teal-200 dark:border-teal-800 px-6 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TbLayoutGrid className="text-teal-700 dark:text-teal-500" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {firstBooking.title}
                            </h3>
                            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-200 rounded-full text-xs font-medium">
                              {item.bookings.length} ห้อง
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <TbCalendar className="w-4 h-4" />
                              {formatDate(firstBooking.booking_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <TbClock className="w-4 h-4" />
                              {formatTime(firstBooking.start_time)} - {formatTime(firstBooking.end_time)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {hasActiveBookingInGroup(item.bookings) && (
                            <button
                              onClick={() => handleCancelGroup(item.groupId!)}
                              disabled={cancellingGroup === item.groupId}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap text-sm"
                            >
                              <TbX className="w-4 h-4" />
                              {cancellingGroup === item.groupId ? 'กำลังยกเลิก...' : 'ยกเลิกทั้งกลุ่ม'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Detail & Equipment (shared across group) */}
                      {firstBooking.detail && (
                        <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">รายละเอียด:</span> {firstBooking.detail}
                          </p>
                        </div>
                      )}
                      {firstBooking.equipment_request && (
                        <div className="mt-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">อุปกรณ์ที่ต้องการ:</span> {firstBooking.equipment_request}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Group Rooms */}
                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        ห้องที่จอง
                      </h4>
                      <div className="space-y-3">
                        {item.bookings.map((booking) => renderBookingCard(booking, true))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-4">
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          จองเมื่อ: {new Date(firstBooking.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withRole(MyBookingsPage, ['admin', 'teacher']);
