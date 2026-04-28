'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  
  // --- Security State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // --- Data State ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Rescheduling Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, supabase]);

  async function fetchData() {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, name, guest_id, status, booking_date, classes(description, start_time)')
      .order('booking_date', { ascending: true });
    
    if (error) console.error("Admin Fetch Error:", error.message);
    setBookings(data || []);
    setLoading(false);
  }

  // --- MATHEMATICAL COLLISION DETECTOR ---
  useEffect(() => {
    if (!selectedDate) {
      setTakenSlots([]);
      return;
    }
    async function checkCollisions() {
      // Fetch all bookings for the target day
      const { data } = await supabase
        .from('bookings')
        .select('id, status, classes(start_time)')
        .eq('booking_date', selectedDate);

      if (data) {
        const blocked = data
          .filter(b => {
            // Only care about Confirmed statuses
            const isConfirmed = b.status?.toLowerCase().includes('confirmed');
            // Do NOT block the slot of the exact booking the Admin is currently moving
            const isNotCurrentEdit = bookingToEdit ? b.id !== bookingToEdit.id : true;
            return isConfirmed && isNotCurrentEdit;
          })
          .map(b => {
            // If it's a custom time like "Confirmed: 17:45"
            if (b.status.includes(':')) {
              return b.status.split(':')[1].trim();
            }
            
            // FIX: Safely handle classes as either an object or an array to satisfy TypeScript
            const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
            
            // If it's a standard template time, safely extract it as a string
            // E.g., "2026-05-03 17:45:00" -> "17:45"
            if (classItem?.start_time) {
              // Bypassing new Date() to prevent Safari/iOS 'Invalid Date' bugs
              const timeStringMatch = classItem.start_time.match(/(\d{2}:\d{2})/);
              if (timeStringMatch) {
                return timeStringMatch[1];
              }
            }
            return null;
          })
          .filter(Boolean) as string[];

        setTakenSlots(blocked);
      }
    }
    checkCollisions();
  }, [selectedDate, bookingToEdit, supabase]);

  // Generate 30-min interval slots from 06:00 to 19:00 for maximum flexibility
  const allAvailableHours = useMemo(() => {
    const slots = [];
    for (let h = 6; h <= 19; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 19) slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // 2. Mathematical 60-Minute Overlap Filter
  const validAdminSlots = allAvailableHours.filter(slot => {
    const [h, m] = slot.split(':').map(Number);
    const slotMins = h * 60 + m;

    for (const taken of takenSlots) {
      const [th, tm] = taken.split(':').map(Number);
      const takenMins = th * 60 + tm;
      
      // Since classes are 1-hour max, if the time difference is less than 60 mins, it's an overlap.
      // Now perfectly handles 17:45 vs 17:00 and 17:30
      if (Math.abs(slotMins - takenMins) < 60) {
        return false; 
      }
    }
    return true;
  });

  // --- ACTIONS ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'Trang@123') setIsAuthenticated(true);
    else alert('Sai thông tin đăng nhập');
  };

  const handleApprove = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus.replace('Pending', 'Confirmed');
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    if (!error) setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch này? (Thao tác này sẽ xóa dữ liệu)')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) setBookings(bookings.filter(b => b.id !== id));
  };

  const openReschedule = (booking: any) => {
    setBookingToEdit(booking);
    setSelectedDate('');
    setSelectedTime('');
    setIsModalOpen(true);
  };

  const submitReschedule = async () => {
    if (!selectedDate || !selectedTime) return alert("Vui lòng chọn ngày và giờ mới.");
    setActionLoading(true);
    
    // Automatically flag as Confirmed since the Admin moved it
    const newStatus = `Confirmed: ${selectedTime}`;

    const { error } = await supabase.from('bookings')
      .update({ booking_date: selectedDate, status: newStatus })
      .eq('id', bookingToEdit.id);

    if (!error) {
      // Re-fetch everything to ensure deep consistency
      fetchData();
      setIsModalOpen(false);
    } else {
      alert('Lỗi cập nhật');
    }
    setActionLoading(false);
  };

  // --- RENDER ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans px-6 bg-stone-50">
        <div className="w-full max-w-sm bg-white p-10 rounded-3xl shadow-xl border border-stone-100">
          <h1 className="text-2xl font-light tracking-widest text-center mb-8 uppercase text-stone-900">Studio<span className="font-semibold">Admin</span></h1>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900 bg-transparent text-stone-900 appearance-none rounded-none" placeholder="Tài khoản" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900 bg-transparent tracking-widest text-stone-900 appearance-none rounded-none" placeholder="Mật khẩu" required />
            <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-full text-xs tracking-widest uppercase hover:bg-stone-800 transition-colors shadow-md mt-4">Đăng nhập</button>
          </form>
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status.includes('Pending')).length;

  // Helper for safe time extraction in UI
  const extractTime = (timeStr: string | undefined) => {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  };

  return (
    <div className="min-h-screen font-sans pb-20 bg-stone-50">
      <nav className="w-full px-8 pt-[max(env(safe-area-inset-top),1.5rem)] pb-6 bg-white/90 backdrop-blur-md border-b border-stone-200 flex justify-between items-center mb-10 sticky top-0 z-10 ios-header-fix">
        <div className="text-xl tracking-widest font-light uppercase text-stone-900">Studio<span className="font-semibold">Admin</span></div>
        <button onClick={() => setIsAuthenticated(false)} className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900">Đăng xuất</button>
      </nav>

      <main className="max-w-6xl mx-auto px-6">
        <header className="mb-10">
          <h1 className="text-4xl font-light text-stone-900 mb-2">Quản lý Lịch tập</h1>
          <p className="text-stone-500">Tổng cộng {bookings.length} lượt đăng ký • <span className="text-amber-600 font-medium">{pendingCount} yêu cầu chờ duyệt</span></p>
        </header>

        <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-stone-400 border-b border-stone-100 bg-stone-50/50">
                <th className="px-6 py-6">Ngày / Khung giờ</th>
                <th className="px-6 py-6">Học viên</th>
                <th className="px-6 py-6">Trạng thái</th>
                <th className="px-6 py-6 text-right">Duyệt</th>
                <th className="px-6 py-6 text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? <tr><td colSpan={5} className="p-10 text-center text-stone-400">Đang tải...</td></tr> : bookings.map((b) => {
                
                // FIX: Apply the array check to the UI render loop as well
                const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
                
                const isCustom = b.status.includes(':');
                const displayStatus = isCustom ? b.status.split(':')[0].trim() : b.status;
                const customTime = isCustom ? b.status.split(':')[1].trim() : null;

                return (
                  <tr key={b.id} className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors">
                    <td className="px-6 py-5">
                      <span className="block font-medium text-stone-900">{b.booking_date}</span>
                      <span className="text-xs text-stone-500">
                        {customTime ? <span className="text-amber-600 font-medium">{customTime} (Custom)</span> : extractTime(classItem?.start_time)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="block font-medium text-stone-900">{b.name}</span>
                      <span className="text-xs text-stone-400">{b.guest_id} - Mã: {classItem?.description || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${displayStatus === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {displayStatus === 'Pending' ? (
                        <button onClick={() => handleApprove(b.id, b.status)} className="px-5 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-widest rounded-full hover:bg-stone-800 transition-all shadow-md">Duyệt</button>
                      ) : <span className="text-xs text-stone-300 uppercase tracking-widest">Đã duyệt</span>}
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button onClick={() => openReschedule(b)} className="px-4 py-2 border border-stone-200 text-xs text-stone-600 uppercase tracking-widest rounded-full hover:bg-stone-50 transition-colors">Đổi</button>
                      <button onClick={() => handleCancel(b.id)} className="px-4 py-2 border border-red-100 text-xs text-red-500 uppercase tracking-widest rounded-full hover:bg-red-50 transition-colors">Hủy</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- ADMIN RESCHEDULE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-light mb-2">Đổi lịch (Admin)</h3>
            <p className="text-sm text-stone-500 mb-8">Hệ thống đã tự động ẩn các giờ bị trùng (overlap 1 tiếng) với học viên khác.</p>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">1. Chọn Ngày</label>
                <input 
                  type="date"
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900 text-stone-900 appearance-none"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">2. Chọn Giờ (06:00 - 19:00)</label>
                <select 
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900 transition-colors disabled:opacity-50 text-stone-900"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate}
                >
                  <option value="">-- Chọn giờ / Select time --</option>
                  {validAdminSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                {selectedDate && validAdminSlots.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 italic">Ngày này đã hoàn toàn kín lịch.</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 transition-colors">Hủy</button>
              <button 
                onClick={submitReschedule} 
                disabled={!selectedDate || !selectedTime || actionLoading}
                className="flex-1 py-4 text-xs bg-stone-900 text-white rounded-full uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-md"
              >
                {actionLoading ? '...' : 'Xác nhận Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}