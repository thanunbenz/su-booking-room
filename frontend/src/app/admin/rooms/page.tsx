'use client';

import { useState, useEffect } from 'react';
import { withRole } from '@/lib/withRole';
import MainLayout from '@/components/layout/MainLayout';
import { roomApi, buildingApi } from '@/lib/api/client';
import { Room, Building } from '@/lib/api/types';
import { TbPlus, TbEdit, TbTrash, TbDoor, TbRefresh, TbFilter } from 'react-icons/tb';
import RoomFormModal from '@/components/admin/RoomFormModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

function ManageRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const [filterBuildingId, setFilterBuildingId] = useState<number | null>(null);

  // Fetch rooms and buildings on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [roomsResponse, buildingsResponse] = await Promise.all([
        roomApi.getAll(),
        buildingApi.getAll(),
      ]);
      setRooms(roomsResponse.data);
      setBuildings(buildingsResponse.data);
    } catch (err: any) {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { building_id: number; name: string; capacity: number; description?: string }) => {
    try {
      await roomApi.create(data);
      await fetchData();
      setShowCreateModal(false);
    } catch (err: any) {
      alert('ไม่สามารถสร้างห้องได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const handleEdit = async (id: number, data: { building_id: number; name: string; capacity: number; description?: string }) => {
    try {
      await roomApi.update(id, data);
      await fetchData();
      setEditingRoom(null);
    } catch (err: any) {
      alert('ไม่สามารถแก้ไขห้องได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await roomApi.delete(id);
      await fetchData();
      setDeletingRoomId(null);
    } catch (err: any) {
      alert('ไม่สามารถลบห้องได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getBuildingName = (buildingId: number) => {
    return buildings.find((b) => b.building_id === buildingId)?.name || 'ไม่ระบุ';
  };

  // Filter rooms by building
  const filteredRooms = filterBuildingId
    ? rooms.filter((room) => room.building_id === filterBuildingId)
    : rooms;

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TbDoor className="text-teal-700 dark:text-teal-500" />
              จัดการห้องเรียน
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              เพิ่ม แก้ไข และลบข้อมูลห้องเรียนในระบบ
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
              เพิ่มห้องใหม่
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {!loading && buildings.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <TbFilter className="text-gray-500 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                กรองตามตึก:
              </label>
              <select
                value={filterBuildingId || ''}
                onChange={(e) => setFilterBuildingId(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">ทั้งหมด</option>
                {buildings.map((building) => (
                  <option key={building.building_id} value={building.building_id}>
                    {building.name}
                  </option>
                ))}
              </select>
              {filterBuildingId && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({filteredRooms.length} ห้อง)
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
        {!loading && filteredRooms.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <TbDoor className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {filterBuildingId ? 'ไม่มีห้องในตึกที่เลือก' : 'ยังไม่มีข้อมูลห้องเรียนในระบบ'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors"
            >
              เพิ่มห้องแรก
            </button>
          </div>
        )}

        {/* Rooms Table */}
        {!loading && filteredRooms.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ชื่อห้อง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ตึก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ความจุ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      คำอธิบาย
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      สร้างเมื่อ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRooms.map((room) => (
                    <tr
                      key={room.room_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        #{room.room_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TbDoor className="text-teal-700 dark:text-teal-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {room.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {getBuildingName(room.building_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {room.capacity} คน
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {room.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(room.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingRoom(room)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <TbEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeletingRoomId(room.room_id)}
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
                {filterBuildingId
                  ? `แสดง ${filteredRooms.length} จาก ${rooms.length} ห้อง`
                  : `ทั้งหมด ${rooms.length} ห้อง`}
              </p>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <RoomFormModal
            title="เพิ่มห้องใหม่"
            buildings={buildings}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        )}

        {editingRoom && (
          <RoomFormModal
            title="แก้ไขห้อง"
            room={editingRoom}
            buildings={buildings}
            onClose={() => setEditingRoom(null)}
            onSubmit={(data) => handleEdit(editingRoom.room_id, data)}
          />
        )}

        {deletingRoomId && (
          <DeleteConfirmModal
            title="ยืนยันการลบห้อง"
            message={`คุณแน่ใจหรือไม่ที่จะลบห้อง "${rooms.find(r => r.room_id === deletingRoomId)?.name}"? การดำเนินการนี้จะลบการจองที่เกี่ยวข้องทั้งหมด`}
            onConfirm={() => handleDelete(deletingRoomId)}
            onCancel={() => setDeletingRoomId(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Export with role protection - Admin only
export default withRole(ManageRoomsPage, ['admin']);
