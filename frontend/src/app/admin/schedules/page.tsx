'use client';

import { useState, useEffect } from 'react';
import { withRole } from '@/lib/withRole';
import MainLayout from '@/components/layout/MainLayout';
import { scheduleApi, roomApi } from '@/lib/api/client';
import { FixedSchedule, Room } from '@/lib/api/types';
import { TbPlus, TbEdit, TbTrash, TbCalendar, TbRefresh, TbFilter } from 'react-icons/tb';
import ScheduleFormModal from '@/components/admin/ScheduleFormModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

function ManageSchedulesPage() {
  const [schedules, setSchedules] = useState<FixedSchedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FixedSchedule | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);
  const [filterRoomId, setFilterRoomId] = useState<number | null>(null);
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<number | null>(null);

  // Fetch schedules and rooms on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [schedulesResponse, roomsResponse] = await Promise.all([
        scheduleApi.getAll(),
        roomApi.getAll(),
      ]);
      setSchedules(schedulesResponse.data);
      setRooms(roomsResponse.data);
    } catch (err: any) {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: {
    room_id: number;
    subject: string;
    teacher_name?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    semester?: string;
  }) => {
    try {
      await scheduleApi.create(data);
      await fetchData();
      setShowCreateModal(false);
    } catch (err: any) {
      alert('ไม่สามารถสร้างตารางเรียนได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const handleEdit = async (
    id: number,
    data: {
      room_id: number;
      subject: string;
      teacher_name?: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      semester?: string;
    }
  ) => {
    try {
      await scheduleApi.update(id, data);
      await fetchData();
      setEditingSchedule(null);
    } catch (err: any) {
      alert('ไม่สามารถแก้ไขตารางเรียนได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await scheduleApi.delete(id);
      await fetchData();
      setDeletingScheduleId(null);
    } catch (err: any) {
      alert('ไม่สามารถลบตารางเรียนได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const getRoomName = (roomId: number) => {
    return rooms.find((r) => r.room_id === roomId)?.name || 'ไม่ระบุ';
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    return days[dayOfWeek - 1] || 'ไม่ระบุ';
  };

  // Filter schedules
  let filteredSchedules = schedules;
  if (filterRoomId) {
    filteredSchedules = filteredSchedules.filter((s) => s.room_id === filterRoomId);
  }
  if (filterDayOfWeek) {
    filteredSchedules = filteredSchedules.filter((s) => s.day_of_week === filterDayOfWeek);
  }

  // Sort schedules by day_of_week and start_time
  filteredSchedules = [...filteredSchedules].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week;
    }
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TbCalendar className="text-teal-700 dark:text-teal-500" />
              จัดการตารางเรียน
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              เพิ่ม แก้ไข และลบตารางการจองในระบบ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <TbRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors flex items-center gap-2 shadow-md"
            >
              <TbPlus className="w-5 h-5" />
              เพิ่มตารางใหม่
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {!loading && rooms.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex flex-wrap items-center gap-4">
              <TbFilter className="text-gray-500 dark:text-gray-400" />

              {/* Room Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ห้อง:
                </label>
                <select
                  value={filterRoomId || ''}
                  onChange={(e) => setFilterRoomId(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  {rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Week Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  วัน:
                </label>
                <select
                  value={filterDayOfWeek || ''}
                  onChange={(e) => setFilterDayOfWeek(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="1">จันทร์</option>
                  <option value="2">อังคาร</option>
                  <option value="3">พุธ</option>
                  <option value="4">พฤหัสบดี</option>
                  <option value="5">ศุกร์</option>
                  <option value="6">เสาร์</option>
                  <option value="7">อาทิตย์</option>
                </select>
              </div>

              {(filterRoomId || filterDayOfWeek) && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({filteredSchedules.length} รายการ)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 dark:border-teal-500 mb-4"></div>
              <p className="text-gray-700 dark:text-gray-200">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSchedules.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <TbCalendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {filterRoomId || filterDayOfWeek
                ? 'ไม่พบตารางเรียนที่ตรงกับเงื่อนไขที่เลือก'
                : 'ยังไม่มีตารางเรียนในระบบ'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors"
            >
              เพิ่มตารางแรก
            </button>
          </div>
        )}

        {/* Schedules Table */}
        {!loading && filteredSchedules.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      วิชา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      อาจารย์
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ห้อง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      วัน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      เทอม
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSchedules.map((schedule) => (
                    <tr
                      key={schedule.schedule_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        #{schedule.schedule_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {schedule.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {schedule.teacher_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {getRoomName(schedule.room_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {getDayName(schedule.day_of_week)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {schedule.start_time} - {schedule.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {schedule.semester || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingSchedule(schedule)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <TbEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeletingScheduleId(schedule.schedule_id)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <TbTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filterRoomId || filterDayOfWeek
                  ? `แสดง ${filteredSchedules.length} จาก ${schedules.length} รายการ`
                  : `ทั้งหมด ${schedules.length} รายการ`}
              </p>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <ScheduleFormModal
            title="เพิ่มตารางเรียนใหม่"
            rooms={rooms}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        )}

        {editingSchedule && (
          <ScheduleFormModal
            title="แก้ไขตารางเรียน"
            schedule={editingSchedule}
            rooms={rooms}
            onClose={() => setEditingSchedule(null)}
            onSubmit={(data) => handleEdit(editingSchedule.schedule_id, data)}
          />
        )}

        {deletingScheduleId && (
          <DeleteConfirmModal
            title="ยืนยันการลบตารางเรียน"
            message={`คุณแน่ใจหรือไม่ที่จะลบตารางเรียน "${schedules.find((s) => s.schedule_id === deletingScheduleId)?.subject
              }"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
            onConfirm={() => handleDelete(deletingScheduleId)}
            onCancel={() => setDeletingScheduleId(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Export with role protection - Admin only
export default withRole(ManageSchedulesPage, ['admin']);
