'use client';

import { useState, useEffect } from 'react';
import { withRole } from '@/lib/withRole';
import MainLayout from '@/components/layout/MainLayout';
import { buildingApi } from '@/lib/api/client';
import { Building } from '@/lib/api/types';
import { TbPlus, TbEdit, TbTrash, TbBuilding, TbRefresh } from 'react-icons/tb';
import BuildingFormModal from '@/components/admin/BuildingFormModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

function ManageBuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deletingBuildingId, setDeletingBuildingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBuildings();
  }, []);

  console.log(buildings);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await buildingApi.getAll();
      setBuildings(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError('ไม่สามารถโหลดข้อมูลตึกได้ กรุณาลองใหม่อีกครั้ง');
      console.error('Error fetching buildings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { name: string; description: string }) => {
    try {
      await buildingApi.create(data);
      await fetchBuildings();
      setShowCreateModal(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert('ไม่สามารถสร้างตึกได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const handleEdit = async (id: number, data: { name: string; description: string }) => {
    try {
      await buildingApi.update(id, data);
      await fetchBuildings();
      setEditingBuilding(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert('ไม่สามารถแก้ไขตึกได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await buildingApi.delete(id);
      await fetchBuildings();
      setDeletingBuildingId(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert('ไม่สามารถลบตึกได้: ' + (err?.error?.message || 'เกิดข้อผิดพลาด'));
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

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TbBuilding className="text-teal-700 dark:text-teal-500" />
              จัดการตึก
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              เพิ่ม แก้ไข และลบข้อมูลตึกในระบบ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchBuildings}
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
              เพิ่มตึกใหม่
            </button>
          </div>
        </div>

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

        {/* Buildings Table */}
        {!loading && buildings.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <TbBuilding className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">ยังไม่มีข้อมูลตึกในระบบ</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors"
            >
              เพิ่มตึกแรก
            </button>
          </div>
        )}

        {!loading && buildings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ชื่อตึก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      สถานที่
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
                  {buildings.map((building) => (
                    <tr
                      key={building.building_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        #{building.building_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {building.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {building.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(building.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingBuilding(building)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <TbEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeletingBuildingId(building.building_id)}
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
                ทั้งหมด {buildings.length} ตึก
              </p>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <BuildingFormModal
            title="เพิ่มตึกใหม่"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        )}

        {editingBuilding && (
          <BuildingFormModal
            title="แก้ไขตึก"
            building={editingBuilding}
            onClose={() => setEditingBuilding(null)}
            onSubmit={(data) => handleEdit(editingBuilding.building_id, data)}
          />
        )}

        {deletingBuildingId && (
          <DeleteConfirmModal
            title="ยืนยันการลบตึก"
            message={`คุณแน่ใจหรือไม่ที่จะลบตึก "${buildings.find(b => b.building_id === deletingBuildingId)?.name}"? การดำเนินการนี้จะลบห้อง และการจองที่เกี่ยวข้องทั้งหมด`}
            onConfirm={() => handleDelete(deletingBuildingId)}
            onCancel={() => setDeletingBuildingId(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Export with role protection - Admin only
export default withRole(ManageBuildingsPage, ['admin']);
