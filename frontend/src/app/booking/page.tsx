'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withRole } from '@/lib/withRole';
import MainLayout from '@/components/layout/MainLayout';
import { bookingApi, buildingApi, roomApi, scheduleApi } from '@/lib/api/client';
import { Building, Room, Booking, FixedSchedule } from '@/lib/api/types';
import { TbCalendar, TbClock, TbMapPin, TbFileText, TbTool, TbAlertCircle, TbLayoutGrid } from 'react-icons/tb';

function BookingPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(0);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [fixedSchedules, setFixedSchedules] = useState<FixedSchedule[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Multi-room mode
  const [isMultiRoom, setIsMultiRoom] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    room_id: 0,
    title: '',
    detail: '',
    equipment_request: '',
    booking_date: '',
    start_time: '09:00',
    end_time: '10:00',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter rooms when building is selected
    if (selectedBuildingId) {
      const filtered = rooms.filter((room) => room.building_id === selectedBuildingId);
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms(rooms);
    }
  }, [selectedBuildingId, rooms]);

  useEffect(() => {
    if (!isMultiRoom && formData.room_id && formData.booking_date) {
      fetchAvailability();
    } else if (!isMultiRoom) {
      setExistingBookings([]);
      setFixedSchedules([]);
    }
  }, [formData.room_id, formData.booking_date, isMultiRoom]);

  const fetchAvailability = async () => {
    if (!formData.room_id || !formData.booking_date) return;

    try {
      setLoadingAvailability(true);

      // Fetch existing bookings
      const bookingsRes = await roomApi.getAvailability(formData.room_id, formData.booking_date);
      setExistingBookings(bookingsRes.data);

      // Fetch fixed schedules for the selected room
      const schedulesRes = await scheduleApi.getByRoomId(formData.room_id);

      // Filter schedules by day of week
      const selectedDate = new Date(formData.booking_date);
      let dayOfWeek = selectedDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sunday from 0 to 7

      const daySchedules = schedulesRes.data.filter(s => s.day_of_week === dayOfWeek);
      setFixedSchedules(daySchedules);
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [buildingsRes, roomsRes] = await Promise.all([
        buildingApi.getAll(),
        roomApi.getAll(),
      ]);
      setBuildings(buildingsRes.data);
      setRooms(roomsRes.data);
      setFilteredRooms(roomsRes.data);
    } catch (err: unknown) {
      setError('ไม่สามารถโหลดข้อมูลได้');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Convert room_id to number
    const parsedValue = name === 'room_id' ? Number(value) : value;
    setFormData({ ...formData, [name]: parsedValue });
    setError('');
    setSuccess('');
  };

  const handleRoomCheckbox = (roomId: number, checked: boolean) => {
    setError('');
    setSuccess('');
    if (checked) {
      setSelectedRoomIds((prev) => [...prev, roomId]);
    } else {
      setSelectedRoomIds((prev) => prev.filter((id) => id !== roomId));
    }
  };

  const handleModeToggle = (multi: boolean) => {
    setIsMultiRoom(multi);
    setError('');
    setSuccess('');
    if (multi) {
      setFormData({ ...formData, room_id: 0 });
    } else {
      setSelectedRoomIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Shared validations
    if (!formData.title.trim()) {
      setError('กรุณากรอกหัวข้อการจอง');
      return;
    }
    if (!formData.booking_date) {
      setError('กรุณาเลือกวันที่');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(formData.booking_date);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      setError('ไม่สามารถจองย้อนหลังได้');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setError('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด');
      return;
    }

    if (isMultiRoom) {
      // Multi-room validation
      if (selectedRoomIds.length < 2) {
        setError('กรุณาเลือกอย่างน้อย 2 ห้องสำหรับการจองหลายห้อง');
        return;
      }
      await submitMultiRoom();
    } else {
      // Single room validation
      if (!formData.room_id) {
        setError('กรุณาเลือกห้อง');
        return;
      }
      await submitSingleRoom();
    }
  };

  const submitSingleRoom = async () => {
    try {
      setSubmitting(true);
      await bookingApi.create({
        room_id: formData.room_id as number,
        title: formData.title.trim(),
        detail: formData.detail.trim(),
        equipment_request: formData.equipment_request.trim(),
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });

      setSuccess('สร้างการจองสำเร็จ! การจองของคุณได้รับการอนุมัติอัตโนมัติแล้ว');
      resetForm();

      setTimeout(() => {
        router.push('/my-bookings');
      }, 2000);
    } catch (err: any) {
      handleBookingError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const submitMultiRoom = async () => {
    try {
      setSubmitting(true);
      await bookingApi.createMulti({
        room_ids: selectedRoomIds,
        title: formData.title.trim(),
        detail: formData.detail.trim(),
        equipment_request: formData.equipment_request.trim(),
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });

      setSuccess(`สร้างการจอง ${selectedRoomIds.length} ห้องสำเร็จ! การจองทั้งหมดได้รับการอนุมัติอัตโนมัติแล้ว`);
      resetForm();

      setTimeout(() => {
        router.push('/my-bookings');
      }, 2000);
    } catch (err: any) {
      handleBookingError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingError = (err: any) => {
    const errorMessage = err?.error?.message || '';

    if (errorMessage.includes('Time slot is already booked')) {
      setError(errorMessage);
    } else if (errorMessage.includes('conflicts with fixed schedule')) {
      setError(errorMessage);
    } else if (errorMessage.includes('Cannot book in the past')) {
      setError('ไม่สามารถจองย้อนหลังได้');
    } else if (errorMessage.includes('Start time must be before end time')) {
      setError('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด');
    } else if (errorMessage.includes('Room not found') || errorMessage.includes('rooms not found')) {
      setError('ไม่พบห้องที่ต้องการจอง');
    } else if (errorMessage.includes('at least 2 rooms')) {
      setError('กรุณาเลือกอย่างน้อย 2 ห้องสำหรับการจองหลายห้อง');
    } else if (errorMessage.includes('Duplicate room ID')) {
      setError('มีห้องที่ซ้ำกันในรายการ');
    } else {
      setError(errorMessage || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const resetForm = () => {
    setFormData({
      room_id: 0,
      title: '',
      detail: '',
      equipment_request: '',
      booking_date: '',
      start_time: '09:00',
      end_time: '10:00',
    });
    setSelectedBuildingId(0);
    setSelectedRoomIds([]);
  };

  const getBuildingName = (buildingId: number) => {
    const building = buildings.find((b) => b.building_id === buildingId);
    return building ? building.name : '';
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const getSelectedRoomsSummary = () => {
    return selectedRoomIds.map((id) => {
      const room = rooms.find((r) => r.room_id === id);
      if (!room) return null;
      return {
        room_id: room.room_id,
        name: room.name,
        building: getBuildingName(room.building_id),
        capacity: room.capacity,
      };
    }).filter(Boolean);
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
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TbCalendar className="text-teal-700 dark:text-teal-500" />
            จองห้องเรียน
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            กรอกข้อมูลการจองห้องเรียน
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
          {/* Booking Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TbLayoutGrid className="inline w-4 h-4 mr-1" />
              โหมดการจอง
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleModeToggle(false)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  !isMultiRoom
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ห้องเดียว
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle(true)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isMultiRoom
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                หลายห้อง
              </button>
            </div>
          </div>

          {/* Building Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TbMapPin className="inline w-4 h-4 mr-1" />
              เลือกตึก
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(Number(e.target.value));
                if (!isMultiRoom) {
                  setFormData({ ...formData, room_id: 0 });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={0}>ทั้งหมด</option>
              {buildings.map((building) => (
                <option key={building.building_id} value={building.building_id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Selection - Single Mode */}
          {!isMultiRoom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TbMapPin className="inline w-4 h-4 mr-1" />
                เลือกห้อง <span className="text-red-500">*</span>
              </label>
              <select
                name="room_id"
                value={formData.room_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value={0}>-- เลือกห้อง --</option>
                {filteredRooms.map((room) => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.name} - {getBuildingName(room.building_id)} (ความจุ: {room.capacity} คน)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Room Selection - Multi Mode */}
          {isMultiRoom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TbMapPin className="inline w-4 h-4 mr-1" />
                เลือกห้อง (อย่างน้อย 2 ห้อง) <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {filteredRooms.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    ไม่พบห้อง
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <label
                      key={room.room_id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                        selectedRoomIds.includes(room.room_id)
                          ? 'bg-teal-50 dark:bg-teal-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoomIds.includes(room.room_id)}
                        onChange={(e) => handleRoomCheckbox(room.room_id, e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {room.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getBuildingName(room.building_id)} | ความจุ: {room.capacity} คน
                        </p>
                      </div>
                      {selectedRoomIds.includes(room.room_id) && (
                        <span className="flex-shrink-0 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                เลือกแล้ว {selectedRoomIds.length} ห้อง
              </p>
            </div>
          )}

          {/* Selected Rooms Summary (Multi-room mode) */}
          {isMultiRoom && selectedRoomIds.length > 0 && (
            <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-teal-800 dark:text-teal-300 mb-2">
                ห้องที่เลือก ({selectedRoomIds.length} ห้อง)
              </h3>
              <div className="flex flex-wrap gap-2">
                {getSelectedRoomsSummary().map((room) => room && (
                  <span
                    key={room.room_id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 rounded-lg text-sm text-gray-800 dark:text-gray-200"
                  >
                    {room.name}
                    <button
                      type="button"
                      onClick={() => handleRoomCheckbox(room.room_id, false)}
                      className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TbFileText className="inline w-4 h-4 mr-1" />
              หัวข้อการจอง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="เช่น ประชุมกลุ่ม วิชา SE"
              required
            />
          </div>

          {/* Detail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TbFileText className="inline w-4 h-4 mr-1" />
              รายละเอียด
            </label>
            <textarea
              name="detail"
              value={formData.detail}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="รายละเอียดเพิ่มเติม"
              rows={3}
            />
          </div>

          {/* Equipment Request */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TbTool className="inline w-4 h-4 mr-1" />
              อุปกรณ์ที่ต้องการ
            </label>
            <textarea
              name="equipment_request"
              value={formData.equipment_request}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="เช่น โปรเจคเตอร์ 1 เครื่อง, คอมพิวเตอร์ 20 เครื่อง"
              rows={2}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TbCalendar className="inline w-4 h-4 mr-1" />
              วันที่ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="booking_date"
              value={formData.booking_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TbClock className="inline w-4 h-4 mr-1" />
                เวลาเริ่ม <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TbClock className="inline w-4 h-4 mr-1" />
                เวลาสิ้นสุด <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              disabled={submitting}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'กำลังส่งคำขอ...'
                : isMultiRoom
                  ? `จอง ${selectedRoomIds.length} ห้อง`
                  : 'ส่งคำขอจอง'
              }
            </button>
          </div>
        </form>

        {/* Availability Display - Show when room and date are selected (single mode only) */}
        {!isMultiRoom && formData.room_id > 0 && formData.booking_date && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TbAlertCircle className="text-teal-700 dark:text-teal-500" />
              การจองและตารางการจอง
              {formData.booking_date && (
                <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                  ({new Date(formData.booking_date).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })})
                </span>
              )}
            </h2>

            {loadingAvailability ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 dark:border-teal-500"></div>
              </div>
            ) : (
              <>
                {/* Fixed Schedules */}
                {fixedSchedules.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">ตารางการจอง:</h3>
                    <div className="space-y-2">
                      {fixedSchedules.map((schedule) => (
                        <div
                          key={schedule.schedule_id}
                          className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-blue-900 dark:text-blue-100">{schedule.subject}</p>
                              {schedule.teacher_name && (
                                <p className="text-sm text-blue-700 dark:text-blue-300">อาจารย์: {schedule.teacher_name}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-900 dark:text-blue-100">
                                <TbClock className="inline w-4 h-4 mr-1" />
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Bookings */}
                {existingBookings.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">การจองที่มีอยู่:</h3>
                    <div className="space-y-2">
                      {existingBookings.map((booking) => (
                        <div
                          key={booking.booking_id}
                          className={`p-3 rounded-lg border ${booking.status === 'approved'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{booking.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {booking.status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                <TbClock className="inline w-4 h-4 mr-1" />
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No conflicts message */}
                {fixedSchedules.length === 0 && existingBookings.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <TbCalendar className="inline w-12 h-12 mb-2 opacity-50" />
                    <p>ไม่มีการจองหรือตารางการจองในวันนี้</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withRole(BookingPage, ['admin', 'teacher']);
