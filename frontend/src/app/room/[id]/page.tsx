'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { IoArrowBack } from 'react-icons/io5';
import { roomApi, scheduleApi } from '@/lib/api/client';
import type { Room, FixedSchedule } from '@/lib/api/types';

// Helper function to format time
const formatTime = (time: string): string => {
  // Remove seconds if present (HH:MM:SS -> HH:MM)
  return time.substring(0, 5);
};

// Helper function to get day name
const getDayName = (dayOfWeek: number): string => {
  const days = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  return days[dayOfWeek] || '';
};

// Helper function to group schedules by day
const groupSchedulesByDay = (schedules: FixedSchedule[]) => {
  const grouped: { [key: number]: FixedSchedule[] } = {};
  schedules.forEach(schedule => {
    if (!grouped[schedule.day_of_week]) {
      grouped[schedule.day_of_week] = [];
    }
    grouped[schedule.day_of_week].push(schedule);
  });
  // Sort schedules within each day by start_time
  Object.keys(grouped).forEach(day => {
    grouped[Number(day)].sort((a, b) => a.start_time.localeCompare(b.start_time));
  });
  return grouped;
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [schedules, setSchedules] = useState<FixedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = All days

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch room details
        const roomResponse = await roomApi.getById(Number(roomId));
        setRoom(roomResponse.data);

        // Fetch schedules for this room
        const schedulesResponse = await scheduleApi.getByRoomId(Number(roomId));
        setSchedules(schedulesResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage = (err as { error?: { message?: string } })?.error?.message;
        setError(errorMessage || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchData();
    }
  }, [roomId]);

  const groupedSchedules = groupSchedulesByDay(schedules);
  const filteredSchedules = selectedDay === 0
    ? schedules
    : schedules.filter(s => s.day_of_week === selectedDay);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !room) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'ไม่พบข้อมูลห้อง'}</p>
          <button
            onClick={() => router.back()}
            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            ย้อนกลับ
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          <IoArrowBack className="h-5 w-5" />
          <span className="font-medium">ย้อนกลับ</span>
        </button>

        {/* Room Info Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ห้อง {room.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {room.building?.name || `ตึก ${room.building_id}`}
            {room.capacity > 0 && ` • ความจุ ${room.capacity} ที่นั่ง`}
          </p>
          {room.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">{room.description}</p>
          )}
        </div>

        {/* Day Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedDay(0)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedDay === 0
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ทุกวัน
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedDay === day
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getDayName(day)}
              </button>
            ))}
          </div>
        </div>

        {/* Schedules Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ตารางเรียนประจำ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredSchedules.length} รายการ
            </p>
          </div>

          <div className="p-6">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedDay === 0 ? 'ยังไม่มีตารางเรียนประจำ' : `ไม่มีตารางเรียนในวัน${getDayName(selectedDay)}`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by day if showing all days */}
                {selectedDay === 0 ? (
                  Object.keys(groupedSchedules)
                    .sort((a, b) => Number(a) - Number(b))
                    .map(dayKey => {
                      const day = Number(dayKey);
                      const daySchedules = groupedSchedules[day];
                      return (
                        <div key={day} className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                            {getDayName(day)}
                          </h3>
                          {daySchedules.map(schedule => (
                            <ScheduleCard key={schedule.schedule_id} schedule={schedule} />
                          ))}
                        </div>
                      );
                    })
                ) : (
                  filteredSchedules.map(schedule => (
                    <ScheduleCard key={schedule.schedule_id} schedule={schedule} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Schedule Card Component
function ScheduleCard({ schedule }: { schedule: FixedSchedule }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {schedule.subject}
        </h3>
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
        </span>
      </div>
      <div className="space-y-1">
        {schedule.teacher_name && (
          <p className="text-gray-600 dark:text-gray-400">
            อาจารย์: {schedule.teacher_name}
          </p>
        )}
        {schedule.semester && (
          <p className="text-sm text-gray-500 dark:text-gray-500">
            ภาคเรียน: {schedule.semester}
          </p>
        )}
      </div>
    </div>
  );
}
