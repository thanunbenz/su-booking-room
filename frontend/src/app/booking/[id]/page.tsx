'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { IoArrowBack, IoCalendarOutline, IoTimeOutline, IoLocationOutline, IoPersonOutline, IoDocumentTextOutline, IoPrintOutline } from 'react-icons/io5';
import { HiOutlineAcademicCap, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { bookingApi } from '@/lib/api/client';
import type { Booking } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { downloadBookingPDF } from '@/lib/downloadBookingPDF';

export default function BookingDetailPage() {
    const params = useParams();
    const bookingId = params.id as string;
    const { user } = useAuth();
    const isAdmin = user?.role?.role_name === 'admin';

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        if (!booking) return;
        try {
            setPrinting(true);
            await downloadBookingPDF(booking.booking_id);
        } catch (err: any) {
            alert(err?.error?.message || 'ไม่สามารถดาวน์โหลด PDF ได้');
        } finally {
            setPrinting(false);
        }
    };

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await bookingApi.getById(Number(bookingId));
                setBooking(response.data);
            } catch (err: any) {
                console.error('Error fetching booking:', err);
                setError(err?.error?.message || 'Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    // Format date to Thai format (DD/MM/YYYY)
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear() + 543; // Convert to Buddhist year
        return `${day}/${month}/${year}`;
    };

    // Format time from HH:MM:SS to HH:MM
    const formatTime = (timeString: string) => {
        return timeString.substring(0, 5); // Get first 5 characters (HH:MM)
    };

    // Get status color
    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
            completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        };
        return colors[status as keyof typeof colors] || colors.pending;
    };

    // Get status text in Thai
    const getStatusText = (status: string) => {
        const statusTexts = {
            pending: 'รอการอนุมัติ',
            approved: 'อนุมัติแล้ว',
            rejected: 'ปฏิเสธ',
            cancelled: 'ยกเลิกแล้ว',
            completed: 'เสร็จสิ้น',
        };
        return statusTexts[status as keyof typeof statusTexts] || status;
    };

    // Loading state
    if (loading) {
        return (
            <MainLayout>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Error state
    if (error || !booking) {
        return (
            <MainLayout>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">เกิดข้อผิดพลาด</h3>
                        <p className="text-red-700 dark:text-red-300 mb-4">{error || 'ไม่พบข้อมูลการจอง'}</p>
                        <Link
                            href="/my-bookings"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                        >
                            <IoArrowBack className="h-5 w-5" />
                            กลับไปหน้ารายการจอง
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <Link
                    href="/my-bookings"
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
                            <div className="space-y-2 flex-1">
                                <h1 className="text-3xl font-bold">
                                    {booking.title}
                                </h1>
                                <p className="text-teal-100 text-lg">
                                    {booking.room?.building?.name || 'ไม่ระบุตึก'} › {booking.room?.name || 'ไม่ระบุห้อง'}
                                </p>
                            </div>
                            {/* Status Badge */}
                            <div className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
                                {getStatusText(booking.status)}
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Title */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                                    <HiOutlineAcademicCap className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">หัวข้อการจอง</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {booking.title}
                                    </p>
                                </div>
                            </div>

                            {/* Booking ID */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <IoDocumentTextOutline className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">เลขที่การจอง</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        #{booking.booking_id}
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
                                        {booking.room?.building?.name || 'ไม่ระบุตึก'}
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
                                        {booking.room?.name || 'ไม่ระบุห้อง'}
                                    </p>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <IoCalendarOutline className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">วันที่จอง</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {formatDate(booking.booking_date)}
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
                                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                    </p>
                                </div>
                            </div>

                            {/* User - Full Width */}
                            <div className="md:col-span-2 flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <IoPersonOutline className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ผู้จอง</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {booking.user?.fullname || 'ไม่ระบุผู้จอง'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Detail Section */}
                        {booking.detail && (
                            <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-800/30 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <IoDocumentTextOutline className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                    รายละเอียด
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {booking.detail}
                                </p>
                            </div>
                        )}

                        {/* Equipment Request Section */}
                        {booking.equipment_request && (
                            <div className="mt-6 p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg border-2 border-teal-200 dark:border-teal-600">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <IoDocumentTextOutline className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                    อุปกรณ์ที่ต้องการ
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {booking.equipment_request}
                                </p>
                            </div>
                        )}

                        {/* Status Note Section */}
                        {booking.status_note && (
                            <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border-2 border-amber-200 dark:border-amber-600">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <IoDocumentTextOutline className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    หมายเหตุสถานะ
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {booking.status_note}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            {isAdmin && booking.status === 'approved' && (
                                <button
                                    onClick={handlePrint}
                                    disabled={printing}
                                    className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-gray-700 text-teal-700 dark:text-teal-400 font-semibold rounded-lg border-2 border-teal-600 dark:border-teal-400 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <IoPrintOutline className="h-5 w-5" />
                                    {printing ? 'กำลังสร้าง PDF...' : 'พิมพ์ PDF (แปะหน้าห้อง)'}
                                </button>
                            )}
                            <Link
                                href="/my-bookings"
                                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                            >
                                กลับไปหน้ารายการจอง
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
