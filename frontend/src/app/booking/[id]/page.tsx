'use client';

import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { IoArrowBack, IoCalendarOutline, IoTimeOutline, IoLocationOutline, IoPersonOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { HiOutlineAcademicCap, HiOutlineOfficeBuilding } from 'react-icons/hi';

export default function BookingDetailPage() {
    // TODO: Fetch booking data from API using the ID from params
    const bookingData = {
        courseCode: '517121',
        courseName: 'ทักษะการเขียนโปรแกรมคอมพิวเตอร์ 1',
        building: 'วิทยาศาสตร์ 1',
        room: '1227/1',
        date: '12/05/2025',
        time: '8:30 - 12:05',
        instructor: 'ฐานันต์ เรืองเดชวิทยา',
        notes: 'ยืมคอมพิวเตอร์ 30 เครื่อง'
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                    <IoArrowBack className="h-5 w-5" />
                    <span className="font-medium">ย้อนกลับ</span>
                </Link>

                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 p-8 text-white">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold">
                                    {bookingData.courseName}
                                </h1>
                                <p className="text-teal-100 text-lg">
                                    {bookingData.building} › {bookingData.room}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Course Code */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                                    <HiOutlineAcademicCap className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">รหัสวิชา</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {bookingData.courseCode}
                                    </p>
                                </div>
                            </div>

                            {/* Course Name */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <IoDocumentTextOutline className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ชื่อวิชา</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {bookingData.courseName}
                                    </p>
                                </div>
                            </div>

                            {/* Building */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <HiOutlineOfficeBuilding className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ตึกเรียน</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {bookingData.building}
                                    </p>
                                </div>
                            </div>

                            {/* Room */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                    <IoLocationOutline className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ห้องเรียน</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {bookingData.room}
                                    </p>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <IoCalendarOutline className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">วัน/เดือน/ปี</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {bookingData.date}
                                    </p>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                                    <IoTimeOutline className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">เวลา</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {bookingData.time}
                                    </p>
                                </div>
                            </div>

                            {/* Instructor - Full Width */}
                            <div className="md:col-span-2 flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <IoPersonOutline className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">อาจารย์ผู้สอน</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {bookingData.instructor}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-800/30 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <IoDocumentTextOutline className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                โน้ตการยืมอุปกรณ์
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {bookingData.notes}
                            </p>
                        </div>

                        {/* Action Button */}
                        <div className="mt-8 flex justify-center">
                            <button className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                                ย้อนกลับ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
