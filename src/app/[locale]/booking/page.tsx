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
  
  // Rescheduling / New Booking State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewBooking, setIsNewBooking] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<any>(null);
  const [selectedNewDate, setSelectedNewDate] = useState<string>('');
  const [selectedNewTime, setSelectedNewTime] = useState<string>('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('guest_id', guestId.trim())
      .eq('pin', pin.trim())
      .single();

    if (error || !data) {
      alert(locale === 'vi' ? 'Sai ID hoặc mã PIN' : 'Invalid ID or PIN');
    } else {
      setLoggedInGuest(data);
    }
    setLoginLoading(false);
  };

  useEffect(() => {
    if (loggedInGuest) fetchGuestDashboard();
  }, [loggedInGuest, supabase]);

  const fetchGuestDashboard = async () => {
    setDashboardLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data: bData } = await supabase
      .from('bookings')
      .select('id, guest_id, status, booking_date, classes(description, start_time)')
      .eq('guest_id', loggedInGuest.guest_id)
      .gte('booking_date', today)
      .order('booking_date', { ascending: true });

    // Fetch all bookings for collision detection
    const { data: allBData } = await supabase
      .from('bookings')
      .select('booking_date, status, classes(start_time)')
      .gte('booking_date', today);

    const taken = (allBData || []).map(b => {
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
    setBookings(bData || []);
    setDashboardLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm(dashboardT('confirmCancel'))) {
      await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', bookingId);
      fetchGuestDashboard();
    }
  };

  const openRescheduleModal = (booking: any) => {
    setIsNewBooking(false);
    setBookingToReschedule(booking);
    setSelectedNewDate('');
    setSelectedNewTime('');
    setIsModalOpen(true);
  };

  const openNewBookingModal = () => {
    setIsNewBooking(true);
    setBookingToReschedule(null);
    setSelectedNewDate('');
    setSelectedNewTime('');
    setIsModalOpen(true);
  };

  const submitBookingModal = async () => {
    setRescheduleLoading(true);
    
    if (isNewBooking) {
      await supabase.from('bookings').insert([{
        guest_id: loggedInGuest.guest_id,
        name: loggedInGuest.name,
        booking_date: selectedNewDate,
        status: `Pending: ${selectedNewTime}`,
      }]);
    } else {
      await supabase.from('bookings')
        .update({ 
          booking_date: selectedNewDate, 
          status: `Pending: ${selectedNewTime}` 
        })
        .eq('id', bookingToReschedule.id);
    }
    
    setIsModalOpen(false);
    setRescheduleLoading(false);
    fetchGuestDashboard();
  };

  const next30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); 
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // --- YOUR EXACT DAY-OF-WEEK LOGIC ---
  const availableSlots = useMemo(() => {
    if (!selectedNewDate) return [];
    
    const [y, m, d] = selectedNewDate.split('-');
    const dayOfWeek = new Date(Number(y), Number(m)-1, Number(d)).getDay(); 
    
    let possibleSlots: string[] = [];
    if (dayOfWeek === 1) possibleSlots = ["08:00", "09:00"];
    else if (dayOfWeek === 2) possibleSlots = ["06:00", "07:00"];
    else if (dayOfWeek === 4 || dayOfWeek === 6) possibleSlots = ["16:00"];
    else if (dayOfWeek === 0) possibleSlots = ["09:30"];
    
    const takenForSelectedDate = takenSlots
      .filter(t => t.startsWith(selectedNewDate))
      .map(t => t.split('_')[1]);

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - tzOffset);
    const todayStr = localNow.toISOString().split('T')[0];

    const isToday = selectedNewDate === todayStr;
    const currentHourDecimal = now.getHours() + (now.getMinutes() / 60);

    return possibleSlots.filter(slot => {
      if (takenForSelectedDate.includes(slot)) return false;
      
      if (isToday) {
        const [h, min] = slot.split(':').map(Number);
        if ((h + (min / 60)) <= currentHourDecimal) return false;
      }
      return true;
    });
  }, [selectedNewDate, takenSlots]);

  const extractTime = (classesObj: any, statusStr: string) => {
    if (statusStr?.includes(':')) return statusStr.split(':')[1].trim();
    const data = Array.isArray(classesObj) ? classesObj[0] : classesObj;
    if (!data?.start_time) return '';
    const match = data.start_time.match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  };

  if (!loggedInGuest) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-rose-200">
        <nav className="w-full px-8 py-8 flex justify-between items-center fixed top-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/50">
          <Link href={`/${locale}`} className="text-2xl tracking-widest font-light uppercase text-stone-900">
            Yoga<span className="font-semibold text-rose-700"> with Chang</span>
          </Link>
          <Link href={`/${locale}`} className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors">
            {locale === 'vi' ? 'Quay lại' : 'Back'}
          </Link>
        </nav>

        <main className="flex-grow flex items-center justify-center px-6 pt-32 pb-20">
          <div className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-xl border border-stone-100">
            <h1 className="text-3xl font-light text-stone-900 mb-2">{t('title')}</h1>
            <p className="text-sm text-stone-400 mb-8">{t('subtitle')}</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2">{t('guestId')}</label>
                <input type="text" value={guestId} onChange={e => setGuestId(e.target.value)} required className="w-full border-b border-stone-300 py-2 text-stone-900 focus:outline-none focus:border-rose-700 bg-transparent transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2">{t('pin')}</label>
                <input type="password" value={pin} onChange={e => setPin(e.target.value)} required className="w-full border-b border-stone-300 py-2 text-stone-900 focus:outline-none focus:border-rose-700 bg-transparent tracking-widest transition-colors" />
              </div>
              <button type="submit" disabled={loginLoading} className="w-full py-4 mt-4 bg-rose-800 text-white rounded-full text-xs uppercase tracking-widest hover:bg-rose-900 disabled:opacity-50 transition-all shadow-md">
                {loginLoading ? '...' : t('login')}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-stone-200/50 text-center">
              <p className="text-xs text-stone-500 leading-relaxed mb-6">
                {t('newCustomer')} <strong className="text-rose-700 font-semibold tracking-wider">{t('newGuestId')}</strong> & <strong className="text-rose-700 font-semibold tracking-wider">{t('newPin')}</strong> {t('asPin')}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-4">{t('contactAfter')}</p>
              
              {/* --- ONLY THIS QR CODE SECTION WAS CHANGED --- */}
              <div className="inline-block p-3 bg-white rounded-3xl border border-stone-100 shadow-sm mt-2">
                <img 
                  src="/qr-code.png" 
                  alt="Contact QR Code" 
                  className="w-40 h-40 mx-auto object-contain rounded-2xl" 
                />
              </div>
              {/* --------------------------------------------- */}

            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-rose-200">
      <nav className="w-full px-8 py-6 flex justify-between items-center bg-white border-b border-stone-200">
        <div className="text-xl tracking-widest font-light uppercase text-stone-900">
          Yoga<span className="font-semibold text-rose-700"> with Chang</span>
        </div>
        <button onClick={() => setLoggedInGuest(null)} className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors">
          {dashboardT('logout')}
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 pb-32">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12">
          <div>
            <h1 className="text-4xl font-light text-stone-900 mb-2">{dashboardT('welcome')}, {loggedInGuest.name}</h1>
            <p className="text-stone-500">{dashboardT('subtitle')}</p>
          </div>
          <button 
            onClick={openNewBookingModal} 
            className="mt-6 md:mt-0 px-6 py-3 bg-rose-800 text-white rounded-full text-xs tracking-widest uppercase hover:bg-rose-900 transition-all shadow-md"
          >
            {dashboardT('bookNew') || 'Book New Session'}
          </button>
        </div>

        {dashboardLoading ? (
          <div className="text-stone-400 animate-pulse">{dashboardT('loading')}</div>
        ) : (
          <div className="grid gap-4">
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-stone-400 bg-white rounded-3xl border border-dashed border-stone-200">
                Bạn chưa có lịch tập nào.
              </div>
            ) : (
              bookings.map(b => {
                const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
                const isCancelled = b.status?.includes('Cancelled');
                const isPending = b.status?.includes('Pending');
                const timeString = extractTime(classItem, b.status);

                return (
                  <div key={b.id} className={`flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl border ${isCancelled ? 'bg-stone-50 border-stone-100 opacity-60' : 'bg-white border-stone-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all'}`}>
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-bold ${isPending ? 'bg-amber-50 text-amber-600' : isCancelled ? 'bg-stone-100 text-stone-500' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isPending ? (dashboardT('pending') || 'Pending') : b.status.split(':')[0]}
                        </span>
                      </div>
                      <h3 className={`text-xl font-medium ${isCancelled ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                        {dashboardT('classCode')}: {classItem?.description || 'Custom'}
                      </h3>
                      <p className="text-stone-500 mt-1">
                        {new Date(b.booking_date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                        <span className="mx-2">•</span> 
                        {timeString}
                      </p>
                    </div>
                    
                    {!isCancelled && (
                      <div className="flex space-x-3">
                        <button onClick={() => openRescheduleModal(b)} disabled={isPending} className="px-6 py-3 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 transition-colors text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent">
                          {dashboardT('reschedule')}
                        </button>
                        <button onClick={() => handleCancelBooking(b.id)} className="px-6 py-3 text-xs text-rose-600 border border-rose-50 rounded-full hover:bg-rose-50 uppercase tracking-widest transition-colors">
                          {dashboardT('cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* --- RESCHEDULE / NEW BOOKING MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-light mb-2 text-stone-900">
              {isNewBooking 
                ? (locale === 'vi' ? 'Đặt Lịch Mới' : 'Book New Session') 
                : (locale === 'vi' ? 'Đổi Lịch Tập' : 'Reschedule Session')}
            </h3>
            <p className="text-sm text-stone-500 mb-8">Chỉ hiển thị các ca tập đang trống trong lịch.</p>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">1. Chọn Ngày</label>
                <select className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-rose-700" value={selectedNewDate} onChange={(e) => { setSelectedNewDate(e.target.value); setSelectedNewTime(''); }}>
                  <option value="">-- Chọn ngày / Select date --</option>
                  {next30Days.map(date => <option key={date} value={date}>{new Date(date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">2. Chọn Giờ</label>
                <select className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 disabled:opacity-50 outline-none focus:border-rose-700" value={selectedNewTime} onChange={(e) => setSelectedNewTime(e.target.value)} disabled={!selectedNewDate}>
                  <option value="">-- Chọn giờ / Select time --</option>
                  {availableSlots.map(slot => <option key={slot} value={slot}>{slot} (1 tiếng)</option>)}
                </select>
                {selectedNewDate && availableSlots.length === 0 && (
                  <p className="text-xs text-rose-600 mt-2 italic">Ngày này nghỉ hoặc đã qua giờ tập.</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 transition-colors text-stone-900">Hủy</button>
              <button 
                onClick={submitBookingModal} 
                disabled={!selectedNewDate || !selectedNewTime || rescheduleLoading} 
                className="flex-1 py-4 text-xs bg-rose-800 text-white rounded-full uppercase tracking-widest hover:bg-rose-900 disabled:opacity-50 transition-colors shadow-md"
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