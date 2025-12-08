import MainLayout from '@/components/layout/MainLayout';
import { FaDesktop } from 'react-icons/fa';

export default function Home() {
  return (
    <MainLayout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 h-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
        <div className="text-center">
          <p className="text-lg">พื้นที่สำหรับเนื้อหา (Content)</p>
          <p className="text-sm mt-2 text-gray-300 dark:text-gray-600">
            กดปุ่มเมนูด้านบนเพื่อเปิด Sidebar แบบ Overlay
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
