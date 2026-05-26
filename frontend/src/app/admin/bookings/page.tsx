'use client';

import { useState, useEffect } from 'react';
import { withRole } from '@/lib/withRole';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { bookingApi, roomApi, buildingApi } from '@/lib/api/client';
import { Booking, Room, Building, User, BookingStatus } from '@/lib/api/types';
import { TbCalendar, TbCheck, TbX, TbTrash, TbUser, TbFilter, TbEye, TbClock, TbMapPin, TbPrinter, TbBan } from 'react-icons/tb';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import {
  downloadBookingPDF,
  downloadBookingsByIds,
  downloadBookingsByFilter,
  type PDFStyle,
} from '@/lib/downloadBookingPDF';
import { formatThaiDateRange } from '@/lib/formatDate';

interface BookingWithUser extends Booking {
  user?: User;
}

function ManageBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRoomId, setFilterRoomId] = useState<number>(0);
  const [filterDate, setFilterDate] = useState<string>('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [printing, setPrinting] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pdfStyle, setPdfStyle] = useState<PDFStyle>('notice');
  const [showFooter, setShowFooter] = useState<boolean>(true);
  const [batchPrinting, setBatchPrinting] = useState<'selected' | 'filter' | null>(null);

  useEffect(() => {
    // Only fetch if we have a token (authenticated)
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchData();
    }
  }, [filterStatus, filterRoomId, filterDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      if (filterRoomId) params.room_id = filterRoomId;
      if (filterDate) params.date = filterDate;

      const [bookingsRes, roomsRes, buildingsRes] = await Promise.all([
        bookingApi.getAll(params),
        roomApi.getAll(),
        buildingApi.getAll(),
      ]);

      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
      setBuildings(buildingsRes.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err?.error?.message) {
        setError(`ไม่สามารถโหลดข้อมูลได้: ${err.error.message}`);
      } else if (err?.message) {
        setError(`ไม่สามารถโหลดข้อมูลได้: ${err.message}`);
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    bookingId: number,
    status: BookingStatus,
    statusNote?: string
  ) => {
    try {
      setUpdating(bookingId);
      await bookingApi.updateStatus(bookingId, {
        status,
        status_note: statusNote || '',
      });
      // Refresh bookings
      await fetchData();
      alert('อัพเดทสถานะสำเร็จ');
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถอัพเดทสถานะได้');
    } finally {
      setUpdating(null);
    }
  };

  const handlePrint = async (bookingId: number) => {
    try {
      setPrinting(bookingId);
      await downloadBookingPDF(bookingId, { style: pdfStyle, showFooter });
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถดาวน์โหลด PDF ได้');
    } finally {
      setPrinting(null);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (visibleIds: number[]) => {
    setSelectedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBatchPrintSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBatchPrinting('selected');
      await downloadBookingsByIds(Array.from(selectedIds), {
        style: pdfStyle,
        showFooter,
      });
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถดาวน์โหลด PDF ได้');
    } finally {
      setBatchPrinting(null);
    }
  };

  const handleBatchPrintFilter = async () => {
    const filter: { status?: string; room_id?: number; booking_date?: string } = {};
    if (filterStatus && filterStatus !== 'all') filter.status = filterStatus;
    if (filterRoomId) filter.room_id = filterRoomId;
    if (filterDate) filter.booking_date = filterDate;
    try {
      setBatchPrinting('filter');
      await downloadBookingsByFilter(filter, { style: pdfStyle, showFooter });
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถดาวน์โหลด PDF ได้');
    } finally {
      setBatchPrinting(null);
    }
  };

  const handleApprove = async (bookingId: number) => {
    if (!confirm('คุณต้องการอนุมัติการจองนี้หรือไม่?')) return;
    await handleUpdateStatus(bookingId, 'approved', 'อนุมัติโดยแอดมิน');
  };

  const handleReject = async (bookingId: number) => {
    const reason = prompt('เหตุผลในการปฏิเสธ (ถ้ามี):');
    if (reason === null) return; // User cancelled
    await handleUpdateStatus(bookingId, 'rejected', reason || 'ปฏิเสธโดยแอดมิน');
  };

  const handleRequestCancellation = async (bookingId: number) => {
    const reason = prompt('เหตุผลในการขอยกเลิก (จะส่งให้ผู้จองยืนยัน):');
    if (reason === null) return; // User cancelled
    try {
      setUpdating(bookingId);
      await bookingApi.requestCancellation(bookingId, reason || 'ขอยกเลิกโดยแอดมิน');
      await fetchData();
      alert('ส่งคำขอยกเลิกแล้ว รอผู้จองยืนยัน');
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถส่งคำขอยกเลิกได้');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (!confirm('คุณต้องการลบการจองนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    try {
      setUpdating(bookingId);
      await bookingApi.delete(bookingId);
      await fetchData();
      alert('ลบการจองสำเร็จ');
    } catch (err: any) {
      alert(err?.error?.message || 'ไม่สามารถลบการจองได้');
    } finally {
      setUpdating(null);
    }
  };

  const getRoomName = (roomId: number) => {
    const room = rooms.find((r) => r.room_id === roomId);
    return room ? room.name : 'ไม่ระบุ';
  };

  const getBuildingName = (roomId: number) => {
    const room = rooms.find((r) => r.room_id === roomId);
    if (!room) return 'ไม่ระบุ';
    const building = buildings.find((b) => b.building_id === room.building_id);
    return building ? building.name : 'ไม่ระบุ';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: {
        label: 'รอการอนุมัติ',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      },
      approved: {
        label: 'อนุมัติแล้ว',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      },
      rejected: {
        label: 'ปฏิเสธ',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      },
      pending_cancellation: {
        label: 'รอยืนยันการยกเลิก',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      },
      cancelled: {
        label: 'ยกเลิกแล้ว',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      },
      completed: {
        label: 'เสร็จสิ้น',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // แปลง HH:MM:SS หรือ HH:MM ให้เป็น HH:MM
    if (!timeString) return '';
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 dark:border-teal-500 mb-4"></div>
            <p className="text-gray-700 dark:text-gray-200">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TbCalendar className="text-teal-700 dark:text-teal-500" />
            จัดการการจอง
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการและอนุมัติการจองห้องเรียนทั้งหมด
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TbFilter className="text-teal-700 dark:text-teal-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ตัวกรอง</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                สถานะ
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอการอนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="pending_cancellation">รอยืนยันการยกเลิก</option>
                <option value="cancelled">ยกเลิกแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ห้อง
              </label>
              <select
                value={filterRoomId}
                onChange={(e) => setFilterRoomId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={0}>ทั้งหมด</option>
                {rooms.map((room) => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วันที่
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* PDF Print Toolbar */}
        {bookings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-3">
            <TbPrinter className="text-teal-600 dark:text-teal-400 w-5 h-5" />
            <span className="font-semibold text-gray-700 dark:text-gray-200">พิมพ์ PDF:</span>

            <label className="text-sm text-gray-600 dark:text-gray-300">รูปแบบ</label>
            <select
              value={pdfStyle}
              onChange={(e) => setPdfStyle(e.target.value as PDFStyle)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="notice">แปะหน้าห้อง (1 หน้า/รายการ)</option>
              <option value="report">สรุปรายการ (ตาราง)</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showFooter}
                onChange={(e) => setShowFooter(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              แสดง footer (พิมพ์เมื่อ / รหัสการจอง)
            </label>

            <div className="flex-1" />

            <button
              onClick={handleBatchPrintSelected}
              disabled={selectedIds.size === 0 || batchPrinting !== null}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <TbPrinter className="w-4 h-4" />
              {batchPrinting === 'selected'
                ? 'กำลังสร้าง...'
                : `พิมพ์ที่เลือก (${selectedIds.size})`}
            </button>

            <button
              onClick={handleBatchPrintFilter}
              disabled={batchPrinting !== null}
              title="พิมพ์เฉพาะการจองที่อนุมัติแล้ว ตามเงื่อนไข room/date ปัจจุบัน"
              className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-700 border border-teal-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <TbPrinter className="w-4 h-4" />
              {batchPrinting === 'filter' ? 'กำลังสร้าง...' : 'พิมพ์ทั้งหมดที่อนุมัติ (ตาม filter)'}
            </button>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <TbCalendar className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">ไม่พบรายการจองที่ตรงกับการกรอง</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select-all row — only approved bookings are selectable for printing */}
            {(() => {
              const approvedIds = bookings
                .filter((b) => b.status === 'approved')
                .map((b) => b.booking_id);
              return (
                <label className="flex items-center gap-3 px-6 py-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      approvedIds.length > 0 &&
                      approvedIds.every((id) => selectedIds.has(id))
                    }
                    onChange={() => toggleSelectAll(approvedIds)}
                    disabled={approvedIds.length === 0}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 disabled:opacity-50"
                  />
                  เลือกทั้งหมดที่อนุมัติแล้ว ({approvedIds.length}/{bookings.length})
                </label>
              );
            })()}

            {bookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Checkbox — only approved bookings can be printed */}
                  <div className="flex items-start pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(booking.booking_id)}
                      onChange={() => toggleSelect(booking.booking_id)}
                      disabled={booking.status !== 'approved'}
                      title={
                        booking.status !== 'approved'
                          ? 'พิมพ์ PDF ได้เฉพาะการจองที่อนุมัติแล้ว'
                          : undefined
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-5 h-5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`เลือก booking #${booking.booking_id}`}
                    />
                  </div>

                  {/* Left Side - Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {booking.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(booking.status)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {booking.booking_id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <TbUser className="text-teal-700 dark:text-teal-500 text-lg" />
                        <span className="text-sm"><span className="font-semibold">ผู้จอง:</span> {booking.user?.fullname || `User ID ${booking.user_id}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiOutlineOfficeBuilding className="text-purple-600 dark:text-purple-400 text-lg" />
                        <span className="text-sm"><span className="font-semibold">ตึก:</span> {getBuildingName(booking.room_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TbMapPin className="text-orange-600 dark:text-orange-400 text-lg" />
                        <span className="text-sm"><span className="font-semibold">ห้อง:</span> {getRoomName(booking.room_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TbCalendar className="text-green-600 dark:text-green-400 text-lg" />
                        <span className="text-sm"><span className="font-semibold">วันที่:</span> {formatThaiDateRange(booking.booking_date, booking.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <TbClock className="text-pink-600 dark:text-pink-400 text-lg" />
                        <span className="text-sm">
                          <span className="font-semibold">เวลา:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </span>
                      </div>
                      {booking.detail && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            รายละเอียด: {booking.detail}
                          </p>
                        </div>
                      )}
                      {booking.equipment_request && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            อุปกรณ์ที่ต้องการ: {booking.equipment_request}
                          </p>
                        </div>
                      )}
                      {booking.status_note && (
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            หมายเหตุ: {booking.status_note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {/* View Details Button */}
                    <Link
                      href={`/booking/${booking.booking_id}`}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap justify-center"
                    >
                      <TbEye className="w-4 h-4" />
                      ดูรายละเอียด
                    </Link>

                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(booking.booking_id)}
                          disabled={updating === booking.booking_id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          <TbCheck className="w-4 h-4" />
                          {updating === booking.booking_id ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
                        </button>
                        <button
                          onClick={() => handleReject(booking.booking_id)}
                          disabled={updating === booking.booking_id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          <TbX className="w-4 h-4" />
                          {updating === booking.booking_id ? 'กำลังปฏิเสธ...' : 'ปฏิเสธ'}
                        </button>
                      </>
                    )}
                    {booking.status === 'approved' && (
                      <button
                        onClick={() => handlePrint(booking.booking_id)}
                        disabled={printing === booking.booking_id}
                        className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-700 border border-teal-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap justify-center"
                      >
                        <TbPrinter className="w-4 h-4" />
                        {printing === booking.booking_id ? 'กำลังสร้าง...' : 'พิมพ์ PDF'}
                      </button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'approved') && (
                      <button
                        onClick={() => handleRequestCancellation(booking.booking_id)}
                        disabled={updating === booking.booking_id}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap justify-center"
                      >
                        <TbBan className="w-4 h-4" />
                        {updating === booking.booking_id ? 'กำลังส่ง...' : 'ขอยกเลิก'}
                      </button>
                    )}
                    {booking.status === 'pending_cancellation' && (
                      <span className="px-4 py-2 text-sm text-orange-700 dark:text-orange-400 whitespace-nowrap flex items-center gap-2">
                        <TbClock className="w-4 h-4" />
                        รอผู้จองยืนยัน
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(booking.booking_id)}
                      disabled={updating === booking.booking_id}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      <TbTrash className="w-4 h-4" />
                      {updating === booking.booking_id ? 'กำลังลบ...' : 'ลบ'}
                    </button>
                  </div>
                </div>

                {/* Footer - Created At */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    จองเมื่อ: {new Date(booking.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withRole(ManageBookingsPage, ['admin']);
