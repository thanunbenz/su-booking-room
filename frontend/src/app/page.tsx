'use client';

import MainLayout from '@/components/layout/MainLayout';
// import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Building, Room, FixedSchedule, Booking } from '@/lib/api/types';
import { buildingApi, roomApi, scheduleApi, bookingApi } from '@/lib/api/client';
// import { IoLocationOutline } from 'react-icons/io5';
import { TbCalendar, TbClock } from 'react-icons/tb';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [schedules, setSchedules] = useState<FixedSchedule[]>([]);
  const [booking, setBooking] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Memoize the date string for stable dependency
  const selectedDateString = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [buildingsRes, roomsRes, schedulesRes, bookingApiRes] = await Promise.all([
          buildingApi.getAll(),
          roomApi.getAll(),
          scheduleApi.getAll(),
          // Public endpoint: approved-only, PII stripped, multi-day aware.
          // The home board is visible to everyone (incl. logged-out), so it must
          // not call the admin-only GET /bookings.
          bookingApi.getPublicCalendar({ from: selectedDateString, to: selectedDateString }),
        ]);

        setBuildings(buildingsRes.data);
        setRooms(roomsRes.data);
        setSchedules(schedulesRes.data);
        setBooking(
          bookingApiRes.data.map((b) => ({
            booking_id: b.booking_id,
            user_id: 0,
            room_id: b.room_id,
            title: b.title,
            detail: '',
            equipment_request: '',
            booking_date: b.booking_date,
            end_date: b.end_date,
            start_time: b.start_time,
            end_time: b.end_time,
            status: b.status as Booking['status'],
            status_note: '',
            created_at: '',
            updated_at: '',
          }))
        );
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage = (err as { error?: { message?: string } })?.error?.message;
        setError(errorMessage || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, selectedDateString]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </MainLayout>
    );
  }

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

    if (timeString.includes('T')) {
      const date = new Date(timeString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // ถ้าเป็น time string ธรรมดา (HH:MM:SS หรือ HH:MM)
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const getSelectedDayOfWeek = () => {
    const day = selectedDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return day === 0 ? 7 : day; // Convert to 1=Mon, 7=Sun
  };

  type ScheduleOrBooking =
    | { type: 'schedule'; data: FixedSchedule }
    | { type: 'booking'; data: Booking };

  const getSchedulesByBuilding = () => {
    const selectedDayOfWeek = getSelectedDayOfWeek();
    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    // Filter schedules for selected day
    const daySchedules = schedules.filter((s) => s.day_of_week === selectedDayOfWeek);

    // Filter approved bookings whose date range covers the selected date
    // (range-aware so multi-day bookings spanning the day still appear).
    const dayBookings = booking.filter((b) => {
      const startStr = b.booking_date.split('T')[0];
      const endStr = (b.end_date || b.booking_date).split('T')[0];
      return startStr <= selectedDateStr && endStr >= selectedDateStr && b.status === 'approved';
    });

    // Group by building
    const grouped: Record<
      number,
      { building: Building; rooms: Record<number, { room: Room; items: ScheduleOrBooking[] }> }
    > = {};

    // Add schedules
    daySchedules.forEach((schedule) => {
      const room = rooms.find((r) => r.room_id === schedule.room_id);
      if (!room) return;

      const building = buildings.find((b) => b.building_id === room.building_id);
      if (!building) return;

      // Create building group if not exists
      if (!grouped[building.building_id]) {
        grouped[building.building_id] = {
          building,
          rooms: {},
        };
      }

      // Create room group if not exists
      if (!grouped[building.building_id].rooms[room.room_id]) {
        grouped[building.building_id].rooms[room.room_id] = {
          room,
          items: [],
        };
      }

      // Add schedule to room
      grouped[building.building_id].rooms[room.room_id].items.push({
        type: 'schedule',
        data: schedule,
      });
    });

    // Add bookings
    dayBookings.forEach((bookingItem) => {
      const room = rooms.find((r) => r.room_id === bookingItem.room_id);
      if (!room) return;

      const building = buildings.find((b) => b.building_id === room.building_id);
      if (!building) return;

      // Create building group if not exists
      if (!grouped[building.building_id]) {
        grouped[building.building_id] = {
          building,
          rooms: {},
        };
      }

      // Create room group if not exists
      if (!grouped[building.building_id].rooms[room.room_id]) {
        grouped[building.building_id].rooms[room.room_id] = {
          room,
          items: [],
        };
      }

      // Add booking to room
      grouped[building.building_id].rooms[room.room_id].items.push({
        type: 'booking',
        data: bookingItem,
      });
    });

    // Sort items in each room by start_time
    Object.values(grouped).forEach((buildingData) => {
      Object.values(buildingData.rooms).forEach((roomData) => {
        roomData.items.sort((a, b) => {
          const aTime = a.data.start_time;
          const bTime = b.data.start_time;

          // แปลงทั้ง timestamp และ time string ให้เป็น minutes from midnight
          const getMinutesFromMidnight = (timeStr: string): number => {
            if (timeStr.includes('T')) {
              // Timestamp - แปลงเป็น Date object แล้วดึง hours และ minutes
              const date = new Date(timeStr);
              return date.getHours() * 60 + date.getMinutes();
            } else {
              // Time string - แปลงเป็น minutes จาก midnight
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            }
          };

          return getMinutesFromMidnight(aTime) - getMinutesFromMidnight(bTime);
        });
      });
    });

    return grouped;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ระบบจองห้อง
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            เลือกตึกเรียนเพื่อดูรายละเอียดห้องเรียนและตารางการจอง หรือดูรายการจองทั้งหมดในระบบ
          </p>
        </div>

        {/* Schedule Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <TbCalendar className="text-teal-700 dark:text-teal-500" />
                  ตารางการจอง
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(selectedDate.toISOString())}
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
                >
                  ← วันก่อน
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  วันนี้
                </button>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setSelectedDate(newDate);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
                >
                  วันถัดไป →
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {Object.keys(getSchedulesByBuilding()).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">ไม่พบตารางเรียน</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      อาคาร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ห้อง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      วิชา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      อาจารย์
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ประเภท
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(getSchedulesByBuilding())
                    .sort((a, b) => a[1].building.name.localeCompare(b[1].building.name, 'th'))
                    .map(([, buildingData]) => {
                      let buildingRowSpan = 0;
                      Object.values(buildingData.rooms).forEach((roomData) => {
                        buildingRowSpan += roomData.items.length;
                      });

                      let isFirstBuildingRow = true;

                      return Object.entries(buildingData.rooms)
                        .sort((a, b) => a[1].room.name.localeCompare(b[1].room.name, 'th'))
                        .map(([, roomData]) => {
                          return roomData.items.map((item, itemIndex) => {
                            const isSchedule = item.type === 'schedule';
                            const data = item.data;

                            // Determine styling based on type
                            const rowBgClass = isSchedule
                              ? 'bg-blue-50/30 dark:bg-blue-900/10'
                              : (item.data as Booking).status === 'approved'
                                ? 'bg-green-50/30 dark:bg-green-900/10'
                                : 'bg-yellow-50/30 dark:bg-yellow-900/10';

                            const row = (
                              <tr
                                key={isSchedule ? `schedule-${(data as FixedSchedule).schedule_id}` : `booking-${(data as Booking).booking_id}`}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${rowBgClass}`}
                              >
                                {/* Building Column */}
                                {isFirstBuildingRow && itemIndex === 0 && (
                                  <td
                                    rowSpan={buildingRowSpan}
                                    className="px-6 py-4 text-sm font-bold text-teal-700 dark:text-teal-400 border-r-2 border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{buildingData.building.name}</span>
                                    </div>
                                  </td>
                                )}

                                {/* Room Column */}
                                {itemIndex === 0 && (
                                  <td
                                    rowSpan={roomData.items.length}
                                    className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                                  >
                                    {roomData.room.name}
                                  </td>
                                )}

                                {/* Time Column */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <TbClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                    <span>
                                      {formatTime(data.start_time)} - {formatTime(data.end_time)}
                                    </span>
                                  </div>
                                </td>

                                {/* Title/Subject Column */}
                                <td className="px-6 py-4">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {isSchedule ? (data as FixedSchedule).subject : (data as Booking).title}
                                  </div>
                                  {!isSchedule && (data as Booking).detail && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {(data as Booking).detail}
                                    </div>
                                  )}
                                </td>

                                {/* Teacher/User Column */}
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {isSchedule
                                      ? (data as FixedSchedule).teacher_name
                                      : (data as Booking).user?.fullname || '-'
                                    }
                                  </div>
                                </td>

                                {/* Type Column */}
                                <td className="px-6 py-4">
                                  {isSchedule ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      ตารางเรียน
                                    </span>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(data as Booking).status === 'approved'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }`}
                                    >
                                      {(data as Booking).status === 'approved' ? 'จองแล้ว (อนุมัติ)' : 'รอการอนุมัติ'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );

                            if (isFirstBuildingRow && itemIndex === 0) {
                              isFirstBuildingRow = false;
                            }

                            return row;
                          });
                        });
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Building List Section */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ตึกเรียนทั้งหมด
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {buildings.length} ตึก
            </p>
          </div>

          <div className="p-6">
            {buildings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">ไม่พบข้อมูลตึกเรียน</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {buildings.map((building) => (
                  <Link
                    key={building.building_id}
                    href={`/building/${building.building_id}`}
                    className="block p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md hover:border-teal-500 dark:hover:border-teal-400 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {building.name}
                      </h3>
                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                        ดูเพิ่มเติม →
                      </span>
                    </div>

                    {building.description && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IoLocationOutline className="h-4 w-4" />
                        <span className="text-sm">{building.description}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div> */}
      </div>
    </MainLayout>
  );
}
