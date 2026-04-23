'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { bookingApi, roomApi } from '@/lib/api/client';
import { PublicCalendarBooking, Room } from '@/lib/api/types';
import { TbChevronLeft, TbChevronRight, TbCalendarMonth } from 'react-icons/tb';
import { formatThaiDateRange } from '@/lib/formatDate';

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const thaiDayShort = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

/** Local date from ISO "YYYY-MM-DD" — avoids UTC drift that `new Date(iso)` introduces. */
function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Enumerate the 42 days (6 weeks × 7) that the month grid shows. */
function monthGridDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 = Sunday
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/** True if `day` falls inside the [booking_date, end_date] range (inclusive). */
function bookingCoversDay(b: PublicCalendarBooking, day: Date): boolean {
  const start = parseDateOnly(b.booking_date);
  const end = parseDateOnly(b.end_date || b.booking_date);
  const dayISO = isoDate(day);
  return isoDate(start) <= dayISO && dayISO <= isoDate(end);
}

const STATUS_COLOR: Record<string, string> = {
  approved: 'bg-teal-600',
  pending: 'bg-amber-500',
  rejected: 'bg-gray-400',
  cancelled: 'bg-gray-400',
  completed: 'bg-teal-800',
};

function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [roomFilter, setRoomFilter] = useState<number>(0);
  const [bookings, setBookings] = useState<PublicCalendarBooking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const gridDays = useMemo(() => monthGridDays(year, month), [year, month]);
  const from = useMemo(() => isoDate(gridDays[0]), [gridDays]);
  const to = useMemo(() => isoDate(gridDays[gridDays.length - 1]), [gridDays]);

  useEffect(() => {
    roomApi.getAll().then((r) => setRooms(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    bookingApi
      .getPublicCalendar({
        from,
        to,
        ...(roomFilter > 0 ? { room_id: roomFilter } : {}),
      })
      .then((r) => {
        if (!cancelled) setBookings(r.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.error?.message || 'โหลดข้อมูลไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, roomFilter]);

  const goPrev = () => {
    const d = new Date(year, month - 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const goNext = () => {
    const d = new Date(year, month + 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  };

  const bookingsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return bookings
      .filter((b) => bookingCoversDay(b, selectedDay))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [bookings, selectedDay]);

  const todayISO = isoDate(today);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <TbCalendarMonth className="w-8 h-8 text-teal-700 dark:text-teal-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ปฏิทินการจอง</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="เดือนก่อนหน้า"
            >
              <TbChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
            >
              วันนี้
            </button>
            <button
              onClick={goNext}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="เดือนถัดไป"
            >
              <TbChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {thaiMonths[month]} {year + 543}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">ห้อง:</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value={0}>ทุกห้อง</option>
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Calendar grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            {thaiDayShort.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-300"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((d, i) => {
              const inMonth = d.getMonth() === month;
              const dayBookings = bookings.filter((b) => bookingCoversDay(b, d));
              const iso = isoDate(d);
              const isToday = iso === todayISO;
              const isSelected =
                selectedDay !== null && isoDate(selectedDay) === iso;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(d)}
                  className={[
                    'min-h-[88px] text-left p-1.5 border-b border-r border-gray-100 dark:border-gray-700 transition-colors',
                    inMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/40',
                    isSelected ? 'ring-2 ring-teal-500 ring-inset' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={[
                        'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                        isToday
                          ? 'bg-teal-600 text-white'
                          : inMonth
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-600',
                      ].join(' ')}
                    >
                      {d.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.booking_id}
                        className={[
                          'text-[10px] text-white rounded px-1 py-0.5 truncate',
                          STATUS_COLOR[b.status] || 'bg-gray-400',
                        ].join(' ')}
                        title={`${b.title} (${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)})`}
                      >
                        {b.start_time.slice(0, 5)} {b.title}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        +{dayBookings.length - 3} เพิ่มเติม
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
        )}

        {/* Selected day panel */}
        {selectedDay && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                การจองวัน
                {selectedDay.toLocaleDateString('th-TH', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ปิด
              </button>
            </div>

            {bookingsForSelectedDay.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ไม่มีการจองในวันนี้
              </p>
            ) : (
              <ul className="space-y-2">
                {bookingsForSelectedDay.map((b) => (
                  <li
                    key={b.booking_id}
                    className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <span
                      className={[
                        'inline-block px-2 py-0.5 text-xs text-white rounded',
                        STATUS_COLOR[b.status] || 'bg-gray-400',
                      ].join(' ')}
                    >
                      {b.start_time.slice(0, 5)}-{b.end_time.slice(0, 5)}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {b.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {b.room_name || `Room #${b.room_id}`}
                        {b.end_date && b.end_date !== b.booking_date && (
                          <span className="ml-2 text-teal-700 dark:text-teal-400">
                            (ช่วง {formatThaiDateRange(b.booking_date, b.end_date)})
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Public page — no auth required. Visitors can view the calendar without logging in.
export default CalendarPage;
