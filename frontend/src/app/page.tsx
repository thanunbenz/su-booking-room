'use client';

import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Building } from '@/lib/api/types';
import { buildingApi } from '@/lib/api/client';
import { IoLocationOutline } from 'react-icons/io5';

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await buildingApi.getAll();
        setBuildings(data);
      } catch (err) {
        console.error('Error fetching buildings:', err);
        const errorMessage = (err as { error?: { message?: string } })?.error?.message;
        setError(errorMessage || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ระบบจองห้องเรียน
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            เลือกตึกเรียนเพื่อดูรายละเอียดห้องเรียนและตารางเรียนประจำ
          </p>
        </div>

        {/* Building List Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
        </div>
      </div>
    </MainLayout>
  );
}
