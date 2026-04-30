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
    setLoading(true);
    // Updated to fetch end_time from classes table
    const { data, error } = await supabase
      .from('bookings')
      .select('id, name, guest_id, status, booking_date, classes(description, start_time, end_time)')
      .order('booking_date', { ascending: true });
    
    if (error) console.error("Admin Fetch Error:", error.message);
    setBookings(data || []);
    setLoading(false);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin credentials
    if (username === 'admin' && password === 'Trang@123') {
      setIsAuthenticated(true);
    } else {
      alert('Sai thông tin / Invalid credentials');
    }
  };

  const handleApprove = async (id: string, currentStatus: string) => {
    let approvedTime = '00:00';
    if (currentStatus.includes(':')) {
      approvedTime = currentStatus.split(':')[1].trim();
    }
    await supabase.from('bookings').update({ status: `Confirmed: ${approvedTime}` }).eq('id', id);
    fetchData();
  };

  const handleDecline = async (id: string) => {
    if(confirm('Chắc chắn hủy yêu cầu này? / Are you sure?')) {
      await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id);
      fetchData();
    }
  };

  const openRescheduleModal = async (booking: any) => {
    setBookingToEdit(booking);
    setSelectedDate('');
    setSelectedTime('');
    
    // Fetch globally taken slots (ignoring cancelled ones)
    const { data } = await supabase.from('bookings').select('booking_date, status, classes(start_time)');
    const taken = (data || [])
      .filter(b => !b.status?.includes('Cancelled'))
      .map(b => {
        let time = '';
        if (b.status?.includes(':')) {
            time = b.status.split(':')[1].trim();
        } else if (b.classes) {
            const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
            const timeMatch = classItem?.start_time?.match(/(\d{2}:\d{2})/);
            if (timeMatch) time = timeMatch[1];
        }
        return `${b.booking_date}_${time}`;
      });
      
    setTakenSlots(taken);
    setIsModalOpen(true);
  };

  const submitReschedule = async () => {
    setActionLoading(true);
    await supabase.from('bookings')
      .update({ booking_date: selectedDate, status: `Confirmed: ${selectedTime}` })
      .eq('id', bookingToEdit.id);
    
    setIsModalOpen(false);
    setActionLoading(false);
    fetchData();
  };

  // Generate 30 days for admin scheduler
  const next30DaysAdmin = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Updated to use your strict Day-of-Week Rules
  const validAdminSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const [y, m, d] = selectedDate.split('-');
    const dayOfWeek = new Date(Number(y), Number(m)-1, Number(d)).getDay(); 
    
    let possibleSlots: string[] = [];
    if (dayOfWeek === 1) possibleSlots = ["08:00", "09:00"];
    else if (dayOfWeek === 2) possibleSlots = ["06:00", "07:00"];
    else if (dayOfWeek === 4 || dayOfWeek === 6) possibleSlots = ["16:00"];
    else if (dayOfWeek === 0) possibleSlots = ["09:30"];
    
    // Filter out taken slots, but DON'T filter past times for Admin
    return possibleSlots.filter(slot => !takenSlots.includes(`${selectedDate}_${slot}`));
  }, [selectedDate, takenSlots]);

  // Helper function to extract time properly
  const extractTime = (classesObj: any, statusStr: string) => {
    if (statusStr?.includes(':')) return statusStr.split(':')[1].trim();
    const data = Array.isArray(classesObj) ? classesObj[0] : classesObj;
    if (!data?.start_time) return '';
    const match = data.start_time.match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  };

  // --- RENDER LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans selection:bg-rose-200">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2rem] shadow-xl max-w-sm w-full mx-4 border border-stone-100">
          <h1 className="text-2xl font-light mb-8 text-center uppercase tracking-widest text-stone-900">Admin Login</h1>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            className="w-full border-b border-stone-300 py-3 mb-6 focus:outline-none focus:border-rose-700 bg-transparent text-stone-900" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full border-b border-stone-300 py-3 mb-8 focus:outline-none focus:border-rose-700 bg-transparent text-stone-900 tracking-widest" 
          />
          <button 
            type="submit" 
            className="w-full bg-rose-800 text-white py-4 rounded-full uppercase tracking-widest text-xs hover:bg-rose-900 transition-colors shadow-md"
          >
            Đăng Nhập
          </button>
        </form>
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status?.includes('Pending')).length;

  // --- RENDER DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-rose-200">
      <nav className="w-full px-8 py-6 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-40">
        <div className="text-xl tracking-widest font-light uppercase text-stone-900">
          Yoga<span className="font-semibold text-rose-700"> with Chang</span> 
          <span className="text-xs text-stone-400 ml-2 tracking-normal uppercase">Admin</span>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)} 
          className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors"
        >
          Đăng Xuất
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 pb-32">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10">
          <div>
            <h1 className="text-4xl font-light text-stone-900 mb-2">Bảng Điều Khiển</h1>
            <p className="text-stone-500">Quản lý Lịch tập</p>
          </div>
          <div className="mt-4 md:mt-0 text-left md:text-right">
            <span className="text-xs uppercase tracking-widest text-stone-400 mr-4">Tổng cộng: {bookings.length}</span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold uppercase tracking-widest text-rose-600 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
                {pendingCount} chờ duyệt
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="p-4 pl-6 text-xs uppercase tracking-widest text-stone-400 font-medium">Ngày / Khung giờ</th>
                <th className="p-4 text-xs uppercase tracking-widest text-stone-400 font-medium">Học Viên</th>
                <th className="p-4 text-xs uppercase tracking-widest text-stone-400 font-medium">Lớp</th>
                <th className="p-4 text-xs uppercase tracking-widest text-stone-400 font-medium">Trạng Thái</th>
                <th className="p-4 pr-6 text-xs uppercase tracking-widest text-stone-400 font-medium">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-400 animate-pulse">Đang tải dữ liệu...</td>
                </tr>
              ) : (
                bookings.map(b => {
                  const isPending = b.status?.includes('Pending');
                  const isCancelled = b.status?.includes('Cancelled');
                  const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
                  
                  const timeDisplay = extractTime(classItem, b.status);

                  return (
                    <tr key={b.id} className={`border-b border-stone-50 transition-colors ${isPending ? 'bg-orange-50/30' : 'hover:bg-stone-50/50'}`}>
                      <td className="p-4 pl-6 whitespace-nowrap">
                        <span className={`block font-medium ${isCancelled ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                          {b.booking_date}
                        </span>
                        <span className="text-xs text-stone-500">{timeDisplay}</span>
                      </td>
                      <td className="p-4">
                        <span className="block font-medium text-stone-900">{b.name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">{b.guest_id}</span>
                      </td>
                      <td className="p-4 text-sm text-stone-600">{classItem?.description || 'Custom Lớp'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full 
                          ${isPending ? 'bg-orange-100 text-orange-700' : 
                            isCancelled ? 'bg-stone-100 text-stone-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          {b.status?.split(':')[0]}
                        </span>
                      </td>
                      <td className="p-4 pr-6 space-x-2 whitespace-nowrap">
                        {isPending && (
                          <button 
                            onClick={() => handleApprove(b.id, b.status)} 
                            className="text-xs bg-stone-900 text-white px-5 py-2.5 rounded-full hover:bg-stone-800 transition-colors shadow-sm"
                          >
                            Duyệt
                          </button>
                        )}
                        {!isCancelled && (
                          <>
                            <button 
                              onClick={() => openRescheduleModal(b)} 
                              className="text-xs border border-stone-200 text-stone-600 px-5 py-2.5 rounded-full hover:bg-stone-50 transition-colors"
                            >
                              Đổi
                            </button>
                            <button 
                              onClick={() => handleDecline(b.id)} 
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors px-3 py-2.5"
                            >
                              Hủy
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- RESCHEDULE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-light mb-8 text-stone-900">Admin Đổi Lịch</h3>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">1. Chọn Ngày Mới</label>
                <select 
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-700 transition-colors text-stone-900"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                >
                  <option value="">-- Chọn ngày / Select date --</option>
                  {next30DaysAdmin.map(date => <option key={date} value={date}>{date}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">2. Chọn Giờ</label>
                <select 
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-700 transition-colors disabled:opacity-50 text-stone-900"
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
                  <p className="text-xs text-rose-600 mt-2 italic">Ngày này nghỉ hoặc đã kín lịch.</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-4 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 transition-colors text-stone-900"
              >
                Hủy
              </button>
              <button 
                onClick={submitReschedule} 
                disabled={!selectedDate || !selectedTime || actionLoading}
                className="flex-1 py-4 text-xs bg-rose-800 text-white rounded-full uppercase tracking-widest hover:bg-rose-900 disabled:opacity-50 transition-colors shadow-md"
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