'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';
import { Building, Room, FixedSchedule } from '@/lib/api/types';
import { buildingApi, roomApi, scheduleApi } from '@/lib/api/client';

// Helper function to format time
const formatTime = (time: string): string => {
  return time.substring(0, 5); // HH:MM:SS -> HH:MM
};

// Helper function to get day name
const getDayName = (dayOfWeek: number): string => {
  const days = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  return days[dayOfWeek] || '';
};

interface RoomWithSchedules extends Room {
  schedules: FixedSchedule[];
}

export default function BuildingDetailPage() {
  const params = useParams();
  const [rooms, setRooms] = useState<RoomWithSchedules[]>([]);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch building info
        const buildingResponse = await buildingApi.getById(Number(params.id));
        setBuilding(buildingResponse.data);

        // Fetch rooms in this building
        const roomsResponse = await roomApi.getByBuildingId(Number(params.id));
        const roomsData = roomsResponse.data;

        // Fetch schedules for each room
        const roomsWithSchedules = await Promise.all(
          roomsData.map(async (room) => {
            try {
              const schedulesResponse = await scheduleApi.getByRoomId(room.room_id);
              return {
                ...room,
                schedules: schedulesResponse.data,
              };
            } catch (err) {
              console.error(`Error fetching schedules for room ${room.room_id}:`, err);
              return {
                ...room,
                schedules: [],
              };
            }
          })
        );

        setRooms(roomsWithSchedules);
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage = (err as { error?: { message?: string } })?.error?.message;
        setError(errorMessage || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !building) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'ไม่พบข้อมูลตึก'}</p>
          <Link
            href="/"
            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            ย้อนกลับ
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          <IoArrowBack className="h-5 w-5" />
          <span className="font-medium">ย้อนกลับ</span>
        </Link>

        {/* Building Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {building.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {rooms.length} ห้องเรียน
          </p>
        </div>

        {/* Rooms List */}
        <div className="space-y-6">
          {rooms.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">ไม่มีห้องเรียนในตึกนี้</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.room_id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Room Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ห้อง {room.name}
                      </h3>
                      {room.capacity > 0 && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          ความจุ {room.capacity} ที่นั่ง
                        </p>
                      )}
                      {room.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {room.description}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/room/${room.room_id}`}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                    >
                      ดูรายละเอียด
                    </Link>
                  </div>
                </div>

                {/* Schedules */}
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    ตารางการจอง
                  </h4>

                  {room.schedules.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      ยังไม่มีตารางการจอง
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {room.schedules.slice(0, 6).map((schedule) => (
                        <div
                          key={schedule.schedule_id}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                              {schedule.subject}
                            </h5>
                            <span className="text-xs font-medium px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded">
                              {getDayName(schedule.day_of_week)}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600 dark:text-gray-400">
                              เวลา: {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </p>
                            {schedule.teacher_name && (
                              <p className="text-gray-600 dark:text-gray-400">
                                อาจารย์: {schedule.teacher_name}
                              </p>
                            )}
                            {schedule.semester && (
                              <p className="text-gray-500 dark:text-gray-500">
                                ภาคเรียน: {schedule.semester}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {room.schedules.length > 6 && (
                    <div className="mt-4 text-center">
                      <Link
                        href={`/room/${room.room_id}`}
                        className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                      >
                        ดูตารางทั้งหมด ({room.schedules.length} รายการ)
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
