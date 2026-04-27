'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function BookingPage() {
  const t = useTranslations('Booking');
  const dashboardT = useTranslations('Dashboard');
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);

  // --- STATE ---
  const [guestId, setGuestId] = useState('');
  const [pin, setPin] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loggedInGuest, setLoggedInGuest] = useState<any>(null);
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // Rescheduling State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<any>(null);
  const [selectedNewDate, setSelectedNewDate] = useState<string>('');
  const [selectedNewTime, setSelectedNewTime] = useState<string>('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { data, error } = await supabase.from('guests').select('*').eq('guest_id', guestId.trim()).eq('pin', pin.trim()).single();
    if (!error && data) setLoggedInGuest(data);
    else alert('Sai ID hoặc PIN / Incorrect credentials');
    setLoginLoading(false);
  };

  // 2. Fetch User Dashboard Data
  useEffect(() => {
    if (!loggedInGuest) return;
    async function loadDashboard() {
      const { data: bData } = await supabase
        .from('bookings')
        .select('id, booking_date, status, classes (description, start_time)')
        .eq('guest_id', loggedInGuest.guest_id)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });
        
      if (bData) setBookings(bData);
      setDashboardLoading(false);
    }
    loadDashboard();
  }, [loggedInGuest, supabase]);

  // 3. Real-Time Vacancy Checker (The Collision Detector)
  useEffect(() => {
    if (!selectedNewDate) {
      setTakenSlots([]);
      return;
    }
    async function checkVacancies() {
      const { data } = await supabase
        .from('bookings')
        .select('classes(start_time)')
        .eq('booking_date', selectedNewDate);
        
      if (data) {
        const blockedTimes = data
          .filter(b => b.classes) 
          .map(b => {
             // FIX: Safely handle classes as either an object or an array
             const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
             
             if (!classItem?.start_time) return null;

             // FIX: Use regex to extract time string safely (avoids Safari Invalid Date crash)
             const timeMatch = classItem.start_time.match(/(\d{2}:\d{2})/);
             return timeMatch ? timeMatch[1] : null;
          })
          .filter(Boolean) as string[];
          
        setTakenSlots(blockedTimes);
      }
    }
    checkVacancies();
  }, [selectedNewDate, supabase]);

  // 4. Actions
  const handleCancel = async (id: string) => {
    if (!confirm(dashboardT('confirmCancel'))) return;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) setBookings(bookings.filter(b => b.id !== id));
  };

  const openReschedule = (booking: any) => {
    setBookingToReschedule(booking);
    setSelectedNewDate('');
    setSelectedNewTime('');
    setIsModalOpen(true);
  };

  const submitReschedule = async () => {
    if (!selectedNewDate || !selectedNewTime) return alert("Vui lòng chọn ngày và giờ / Please select date & time");
    setRescheduleLoading(true);
    
    const { error } = await supabase.from('bookings')
      .update({ 
         status: `Pending: ${selectedNewTime}`, 
         booking_date: selectedNewDate 
      })
      .eq('id', bookingToReschedule.id);
      
    if (!error) {
      alert("Đã gửi yêu cầu đổi lịch / Request sent");
      setBookings(bookings.map(b => b.id === bookingToReschedule.id ? { ...b, status: `Pending: ${selectedNewTime}`, booking_date: selectedNewDate } : b));
      setIsModalOpen(false);
    } else {
      alert("Lỗi / Error processing request");
    }
    setRescheduleLoading(false);
  };

  // --- FLEXIBLE SLOT GENERATOR ---
  const next30Days = Array.from({length: 30}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i + 1));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const getAvailableTimeSlots = (dateString: string) => {
    if (!dateString) return [];
    
    const [y, m, d] = dateString.split('-');
    const dayOfWeek = new Date(Number(y), Number(m)-1, Number(d)).getDay(); 
    
    let possibleSlots: string[] = [];

    if (dayOfWeek === 1) possibleSlots = ["08:00", "09:00"];
    else if (dayOfWeek === 2) possibleSlots = ["06:00", "07:00"];
    else if (dayOfWeek === 4 || dayOfWeek === 6) possibleSlots = ["16:00"];
    else if (dayOfWeek === 0) possibleSlots = ["09:30"];

    return possibleSlots.filter(slot => !takenSlots.includes(slot));
  };

  const availableSlots = getAvailableTimeSlots(selectedNewDate);

  // Helper for safe time extraction in UI
  const extractTime = (classesObj: any) => {
    const data = Array.isArray(classesObj) ? classesObj[0] : classesObj;
    if (!data?.start_time) return '';
    const match = data.start_time.match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  };

  // ==========================================
  // VIEW 1: LOGIN FORM
  // ==========================================
  if (!loggedInGuest) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Link href={`/${locale}`} className="mb-8 text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
          ← {locale === 'vi' ? 'Quay lại' : 'Go Back'}
        </Link>
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 shadow-2xl shadow-stone-200/50 border border-stone-100 rounded-3xl transform transition-all">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-light text-stone-900 mb-2">{t('title')}</h1>
            <p className="text-sm text-stone-500">{t('subtitle')}</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">{t('guestId')}</label>
              <input type="text" value={guestId} onChange={(e) => setGuestId(e.target.value)} required className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900 bg-transparent text-stone-900" placeholder="VD: CN001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">{t('pin')}</label>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} required className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900 bg-transparent text-stone-900 tracking-[0.5em]" placeholder="••••••" />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full bg-stone-900 text-white py-4 rounded-full text-xs tracking-widest uppercase hover:bg-stone-800 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-4 disabled:opacity-50">
              {loginLoading ? '...' : t('login')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen pb-20">
      <nav className="w-full px-8 py-6 flex justify-between items-center border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="text-xl tracking-widest font-light uppercase">Yoga<span className="font-semibold">Studio</span></div>
        <button onClick={() => setLoggedInGuest(null)} className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
          {dashboardT('logout')}
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 mt-12">
        <h1 className="text-4xl font-light text-stone-900 mb-2 italic">{dashboardT('welcome')}, {loggedInGuest.name}</h1>
        <p className="text-stone-500 mb-10">{dashboardT('subtitle')}</p>

        <div className="space-y-5">
          {dashboardLoading ? (
             <div className="p-10 text-center text-stone-400 animate-pulse">{dashboardT('loading')}</div>
          ) : bookings.length === 0 ? (
             <div className="p-10 text-center text-stone-400 border border-stone-200 border-dashed rounded-3xl">Bạn chưa có lịch tập nào.</div>
          ) : bookings.map((b) => {
            // FIX: Ensure classItem is safely extracted for UI rendering
            const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
            
            return (
            <div key={b.id} className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-bold ${b.status.includes('Pending') ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {b.status.includes('Pending') ? 'Pending' : b.status}
                  </span>
                </div>
                <h3 className="text-xl font-medium text-stone-800">{dashboardT('classCode')}: {classItem?.description || "Custom"}</h3>
                <p className="text-stone-500 mt-1">
                  {new Date(b.booking_date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  <span className="mx-2">•</span> 
                  {b.status.includes('Pending') ? b.status.split(': ')[1] : extractTime(classItem)}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button onClick={() => openReschedule(b)} disabled={b.status.includes('Pending')} className="px-6 py-3 text-xs border border-stone-200 rounded-full hover:bg-stone-50 uppercase tracking-widest disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  {dashboardT('reschedule')}
                </button>
                <button onClick={() => handleCancel(b.id)} className="px-6 py-3 text-xs text-red-400 border border-red-50 rounded-full hover:bg-red-50 uppercase tracking-widest transition-colors">
                  {dashboardT('cancel')}
                </button>
              </div>
            </div>
          )})}
        </div>
      </main>

      {/* --- RESCHEDULE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-light mb-2">Đổi lịch tập</h3>
            <p className="text-sm text-stone-500 mb-8">Chỉ hiển thị các ca tập 1 tiếng đang trống.</p>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">1. Chọn Ngày</label>
                <select 
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900 transition-colors"
                  value={selectedNewDate}
                  onChange={(e) => { setSelectedNewDate(e.target.value); setSelectedNewTime(''); }}
                >
                  <option value="">-- Chọn ngày / Select date --</option>
                  {next30Days.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">2. Chọn Giờ</label>
                <select 
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900 transition-colors disabled:opacity-50"
                  value={selectedNewTime}
                  onChange={(e) => setSelectedNewTime(e.target.value)}
                  disabled={!selectedNewDate}
                >
                  <option value="">-- Chọn giờ / Select time --</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot} (1 tiếng)
                    </option>
                  ))}
                </select>
                {selectedNewDate && availableSlots.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 italic">Ngày này đã kín lịch hoặc không có ca tập.</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 transition-colors">Hủy</button>
              <button 
                onClick={submitReschedule} 
                disabled={!selectedNewDate || !selectedNewTime || rescheduleLoading}
                className="flex-1 py-4 text-xs bg-stone-900 text-white rounded-full uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-md"
              >
                {rescheduleLoading ? '...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}