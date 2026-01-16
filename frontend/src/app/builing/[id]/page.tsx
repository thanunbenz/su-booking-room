'use client';

import MainLayout from '@/components/layout/MainLayout';

export default function BuildingDetailPage() {

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Search Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Building Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ตึกเรียน
                            </label>
                            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors">
                                <option>ตึกเรียน</option>
                                <option>วิทยาศาสตร์ 1</option>
                                <option>15 ชั้น</option>
                            </select>
                        </div>

                        {/* Room Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ห้องเรียน
                            </label>
                            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors">
                                <option>ห้องเรียน</option>
                                <option>1227/1</option>
                            </select>
                        </div>

                        {/* Date Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                วัน/เดือน/ปี
                            </label>
                            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors">
                                <option>วัน/เดือน/ปี</option>
                            </select>
                        </div>

                        {/* Time Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                เวลา
                            </label>
                            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors">
                                <option>เวลา</option>
                            </select>
                        </div>

                        {/* Search Button */}
                        <div className="flex items-end">
                            <button className="w-full px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                                ค้นหา
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                    {/* Header with Date */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            ห้องเรียน 1227/1
                        </h2>
                        <span className="text-gray-600 dark:text-gray-400">
                            Monday 12/05/2025
                        </span>
                    </div>

                    {/* Room Schedule Cards */}
                    <div className="p-6 space-y-4">
                        {/* Card 1 - Course 517121 */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                    517121
                                </h3>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    8:30 - 12:05
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-gray-600 dark:text-gray-400">
                                    ทักษะการเขียนโปรแกรมคอมพิวเตอร์ 1
                                </p>
                                <button className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
                                    ดูเพิ่มเติม
                                </button>
                            </div>
                        </div>

                        {/* Card 2 - Course 517122 */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                    517122
                                </h3>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    13:00 - 15:45
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-gray-600 dark:text-gray-400">
                                    ทักษะการเขียนโปรแกรมคอมพิวเตอร์ 2
                                </p>
                                <button className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
                                    ดูเพิ่มเติม
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors">
                            1
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            2
                        </button>
                        <span className="text-gray-500 dark:text-gray-400">...</span>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            9
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            &gt;
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
