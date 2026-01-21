'use client';

import { useEffect } from 'react';
import { IoClose } from 'react-icons/io5';

interface BookingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingData: {
        id: string;
        courseCode: string;
        courseName: string;
        building: string;
        room: string;
        date: string;
        time: string;
        instructor: string;
        notes: string;
    };
}

export default function BookingDetailModal({ isOpen, onClose, bookingData }: BookingDetailModalProps) {
    // ปิด modal เมื่อกด ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // ป้องกันการ scroll หน้าหลังเมื่อเปิด modal
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content - Bootstrap Style */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {bookingData.courseCode} | {bookingData.courseName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="ปิด"
                    >
                        <IoClose className="h-6 w-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    {/* Info Grid - Bootstrap Form Style */}
                    <div className="space-y-4">
                        {/* Course Code */}
                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                รหัสวิชา
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {bookingData.courseCode}
                                </div>
                            </div>
                        </div>

                        {/* Course Name */}
                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                ชื่อวิชา
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {bookingData.courseName}
                                </div>
                            </div>
                        </div>

                        {/* Building */}
                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                ตึกเรียน
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {bookingData.building}
                                </div>
                            </div>
                        </div>

                        {/* Room */}
                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                ห้องเรียน
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {bookingData.room}
                                </div>
                            </div>
                        </div>

                        {/* Date and Time in same row */}
                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                วัน/เดือน/ปี
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {bookingData.date}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                เวลา
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {bookingData.time}
                                </div>
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                อาจารย์ผู้สอน
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {bookingData.instructor}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="grid grid-cols-3 gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                                โน้ตการยืมอุปกรณ์
                            </label>
                            <div className="col-span-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 min-h-20 whitespace-pre-wrap">
                                    {bookingData.notes}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        ย้อนกลับ
                    </button>
                </div>
            </div>
        </div>
    );
}
