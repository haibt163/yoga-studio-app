'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function CalendarPage() {
  const navT = useTranslations('Navigation');
  const calT = useTranslations('Calendar');
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);

  // --- STATE ---
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  // Security State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Admin New Booking State
  const [showAdminBookModal, setShowAdminBookModal] = useState(false);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookGuestId, setBookGuestId] = useState('');
  const [bookPin, setBookPin] = useState(''); // <-- Changed from bookName
  const [bookLoading, setBookLoading] = useState(false);

  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0); 
      return d;
    });
  }, []);

  const fetchCalendar = async () => {
    setLoading(true);
    const startOfToday = new Date(next7Days[0]);
    const endOfNextWeek = new Date(next7Days[6]);
    endOfNextWeek.setHours(23, 59, 59, 999);

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('id, name, guest_id, status, booking_date, classes(description, start_time)')
      .gte('booking_date', startOfToday.toISOString().split('T')[0])
      .lte('booking_date', endOfNextWeek.toISOString().split('T')[0])
      .order('booking_date', { ascending: true });

    if (bookingError) {
      console.error("Fetch Calendar Error:", bookingError);
      setLoading(false);
      return;
    }

    const confirmedBookings = (bookingData || []).filter(b => 
      b.status && (b.status.toLowerCase().includes('confirmed') || b.status.toLowerCase().includes('pending'))
    );

    const mappedClasses = confirmedBookings.map(b => {
      const classItem = Array.isArray(b.classes) ? b.classes[0] : b.classes;
      const isPending = b.status?.toLowerCase().includes('pending');
      
      let timeString = '00:00';
      if (b.status?.includes(':')) {
         timeString = b.status.split(':')[1].trim();
      } else if (classItem?.start_time) {
         const match = classItem.start_time.match(/(\d{2}:\d{2})/);
         if (match) timeString = match[1];
      }

      return {
        class_id: b.id,
        raw_date: b.booking_date,
        time_string: timeString,
        description: classItem?.description || 'Custom',
        guests: { name: b.name || b.guest_id },
        isPending
      };
    });

    setClasses(mappedClasses);
    setLoading(false);
  };

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && sessionStorage.getItem('studio_admin_auth') === 'true') {
      setIsAdmin(true);
    }
    fetchCalendar();
  }, [supabase, next7Days]);

  // --- HANDLERS ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'Trang@123') {
      sessionStorage.setItem('studio_admin_auth', 'true');
      setIsAdmin(true);
      setShowAuthModal(false);
      setUsername('');
      setPassword('');
    } else {
      alert('Invalid credentials / Sai mật khẩu');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('studio_admin_auth');
    setIsAdmin(false);
  };

  const handleSyncCalendar = () => {
    const currentHost = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'webcal://' : 'http://';
    window.location.href = `${protocol}${currentHost}/api/calendar/feed?nocache=${Date.now()}`;
  };

  const openAdminBookModal = (dateStr: string, timeStr: string) => {
    setBookDate(dateStr);
    setBookTime(timeStr);
    setBookGuestId('');
    setBookPin('');
    setShowAdminBookModal(true);
  };

  const handleAdminBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookLoading(true);

    // 1. Verify Guest ID and PIN with Supabase
    const { data: guestData, error: guestError } = await supabase
      .from('guests')
      .select('name')
      .eq('guest_id', bookGuestId.trim())
      .eq('pin', bookPin.trim())
      .single();

    if (guestError || !guestData) {
      alert(locale === 'vi' ? 'Sai ID hoặc mã PIN của học viên' : 'Invalid Guest ID or PIN');
      setBookLoading(false);
      return;
    }

    // 2. Insert using the verified guest's name
    await supabase.from('bookings').insert([{
      guest_id: bookGuestId.trim(),
      name: guestData.name,
      booking_date: bookDate,
      status: `Confirmed: ${bookTime}`
    }]);
    
    setShowAdminBookModal(false);
    setBookLoading(false);
    fetchCalendar(); 
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen pb-20 bg-stone-50 font-sans selection:bg-rose-200">
      
      <nav className="w-full px-8 pt-[max(env(safe-area-inset-top),1.5rem)] pb-6 flex justify-between items-center border-b border-stone-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all ios-header-fix">
        <Link href={`/${locale}`} className="text-xl tracking-widest font-light uppercase text-stone-900">
          Yoga<span className="font-semibold text-rose-700"> with Chang</span>
        </Link>
        <div className="flex space-x-6 items-center">
           {isAdmin ? (
             <button onClick={handleAdminLogout} className="text-[10px] text-stone-400 hover:text-rose-700 transition-colors uppercase tracking-widest font-bold">
               {calT('adminOn')}
             </button>
           ) : (
             <button onClick={() => setShowAuthModal(true)} className="text-[10px] text-stone-300 hover:text-stone-600 transition-colors uppercase tracking-widest">
               {calT('adminOff')}
             </button>
           )}
          <Link href={`/${locale}/booking`} className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors">
            {navT('booking')}
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end">
          <div>
            <h1 className="text-4xl font-light text-stone-900 mb-2 italic">{calT('title')}</h1>
            <p className="text-stone-500">{calT('subtitle')}</p>
          </div>
          <button 
            onClick={handleSyncCalendar}
            className="mt-6 md:mt-0 px-6 py-3 bg-stone-900 text-white rounded-full text-xs tracking-widest uppercase hover:bg-stone-800 transition-all shadow-md flex items-center justify-center space-x-2 w-full md:w-auto"
          >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>{calT('sync')}</span>
          </button>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-stone-400 animate-pulse">{calT('loading')}</div>
        ) : (
          <div className="flex md:grid md:grid-cols-7 overflow-x-auto gap-4 pb-8 snap-x scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {next7Days.map((day, i) => {
              const targetYear = day.getFullYear();
              const targetMonth = String(day.getMonth() + 1).padStart(2, '0');
              const targetDay = String(day.getDate()).padStart(2, '0');
              const targetLocalString = `${targetYear}-${targetMonth}-${targetDay}`;
              
              const dayClasses = classes.filter(cls => cls.raw_date === targetLocalString);
              const bookedTimes = dayClasses.map(cls => cls.time_string);
              
              // --- DAY OF WEEK LOGIC INTEGRATED HERE ---
              const dayOfWeek = day.getDay();
              let possibleSlots: string[] = [];
              if (dayOfWeek === 1) possibleSlots = ["08:00", "09:00"];
              else if (dayOfWeek === 2) possibleSlots = ["06:00", "07:00"];
              else if (dayOfWeek === 4 || dayOfWeek === 6) possibleSlots = ["16:00"];
              else if (dayOfWeek === 0) possibleSlots = ["09:30"];

              const now = new Date();
              const targetDateIsToday = targetLocalString === now.toISOString().split('T')[0];
              const currentHourDecimal = now.getHours() + (now.getMinutes() / 60);

              const vacantSlots = possibleSlots.filter(s => {
                  if (bookedTimes.includes(s)) return false;
                  if (targetDateIsToday) {
                      const [h, min] = s.split(':').map(Number);
                      if ((h + (min / 60)) <= currentHourDecimal) return false;
                  }
                  return true;
              });

              // Combine BOTH sets into one array for Chronological Sorting
              const allDaySlots = [
                  ...dayClasses.map(cls => ({ ...cls, isVacant: false })),
                  ...vacantSlots.map(slot => ({ isVacant: true, time_string: slot, class_id: `vacant_${slot}` }))
              ];

              allDaySlots.sort((a, b) => a.time_string.localeCompare(b.time_string));

              const visibleSlots = allDaySlots.filter(s => isAdmin || !s.isVacant);
              const isToday = i === 0;

              return (
                <div key={i} className={`flex-none w-[260px] md:w-auto flex flex-col bg-white rounded-3xl border ${isToday ? 'border-rose-700 shadow-md relative' : 'border-stone-100 shadow-sm'} overflow-hidden snap-center`}>
                  {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-rose-700"></div>}
                  
                  <div className={`p-5 text-center border-b ${isToday ? 'bg-rose-50/50' : 'border-stone-50'}`}>
                    <span className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">
                      {day.toLocaleDateString(locale, { weekday: 'short' })}
                    </span>
                    <span className={`text-3xl font-light ${isToday ? 'text-stone-900' : 'text-stone-600'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="p-4 space-y-3 flex-grow bg-stone-50/20">
                    
                    {visibleSlots.length === 0 ? (
                      <div className="h-full min-h-[120px] flex items-center justify-center text-[10px] text-stone-300 uppercase tracking-widest">
                        {possibleSlots.length === 0 ? "Off day" : calT('empty')}
                      </div>
                    ) : (
                      visibleSlots.map((slotObj) => {
                        // Render Admin Vacant Spots
                        if (slotObj.isVacant) {
                           return (
                            <div key={slotObj.class_id} className="p-3 rounded-2xl border border-dashed border-stone-300 bg-transparent flex justify-between items-center group hover:border-rose-400 transition-colors">
                              <span className="text-sm font-medium text-stone-400">{slotObj.time_string}</span>
                              <button onClick={() => openAdminBookModal(targetLocalString, slotObj.time_string)} className="text-[10px] uppercase tracking-widest text-rose-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-rose-50 rounded-full">
                                {calT('book')}
                              </button>
                            </div>
                          );
                        } 
                        
                        // Render Confirmed/Pending Bookings
                        return (
                          <div key={slotObj.class_id} className={`p-4 rounded-2xl border ${isAdmin ? 'bg-stone-50 border-stone-200' : 'bg-stone-100 border-transparent'} ${slotObj.isPending ? 'border-amber-200 bg-amber-50/30' : ''} transition-all`}>
                            <p className={`text-sm font-medium flex justify-between items-center ${isAdmin ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                              <span>{slotObj.time_string}</span>
                              {slotObj.isPending && isAdmin && <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-100">Pending</span>}
                            </p>
                            
                            {isAdmin ? (
                              <div className="mt-2">
                                <span className="block text-xs font-mono text-stone-500">{slotObj.description}</span>
                                <span className="block text-[10px] uppercase tracking-widest text-rose-600 mt-1 font-semibold">{slotObj.guests?.name || calT('unknown')}</span>
                              </div>
                            ) : (
                              <div className="mt-1">
                                <span className="text-[10px] uppercase tracking-widest text-stone-400">{calT('busy')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light mb-6 text-center uppercase tracking-widest text-stone-900">{calT('loginTitle')}</h3>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-rose-700 bg-transparent text-stone-900 appearance-none rounded-none" placeholder={calT('username')} required />
              </div>
              <div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-rose-700 bg-transparent tracking-widest text-stone-900 appearance-none rounded-none" placeholder={calT('password')} required />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAuthModal(false)} className="flex-1 py-3 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 transition-colors text-stone-900">{calT('cancel')}</button>
                <button type="submit" className="flex-1 py-3 text-xs bg-rose-800 text-white rounded-full uppercase tracking-widest hover:bg-rose-900 transition-colors shadow-md">{calT('login')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminBookModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light mb-2 text-stone-900">Add Booking</h3>
            <p className="text-sm text-stone-500 mb-6">{bookDate} at {bookTime}</p>
            <form onSubmit={handleAdminBookSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Guest ID</label>
                <input type="text" value={bookGuestId} onChange={e => setBookGuestId(e.target.value)} className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-rose-700 text-stone-900" placeholder="e.g. CN012" required />
              </div>
              <div>
                {/* Changed to Guest PIN */}
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Guest PIN</label>
                <input type="password" value={bookPin} onChange={e => setBookPin(e.target.value)} maxLength={6} className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-rose-700 text-stone-900 tracking-widest" placeholder="••••••" required />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAdminBookModal(false)} className="flex-1 py-3 text-xs border border-stone-200 rounded-full uppercase tracking-widest text-stone-900 hover:bg-stone-50">Cancel</button>
                <button type="submit" disabled={bookLoading} className="flex-1 py-3 text-xs bg-rose-800 text-white rounded-full uppercase tracking-widest hover:bg-rose-900 shadow-md">
                  {bookLoading ? '...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}