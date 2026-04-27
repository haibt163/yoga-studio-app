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

  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0); 
      return d;
    });
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && sessionStorage.getItem('studio_admin_auth') === 'true') {
      setIsAdmin(true);
    }

    async function fetchCalendar() {
      const startOfToday = new Date(next7Days[0]);
      const endOfNextWeek = new Date(next7Days[6]);
      endOfNextWeek.setHours(23, 59, 59, 999);

      // FIX: Fetch classes and guests separately to avoid the PGRST200 Foreign Key Error
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .gte('start_time', startOfToday.toISOString())
        .lte('start_time', endOfNextWeek.toISOString())
        .order('start_time', { ascending: true });

      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('guest_id, name');

      if (classError || guestError) {
        console.error("Fetch Calendar Error:", classError || guestError);
        setLoading(false);
        return;
      }

      // Map the guest names manually to the classes
      const guestMap = new Map(guestData?.map(g => [g.guest_id.trim(), g.name]));
      
      const mergedClasses = (classData || []).map(cls => ({
        ...cls,
        guests: { name: guestMap.get(cls.guest_id?.trim()) || calT('unknown') }
      }));

      setClasses(mergedClasses);
      setLoading(false);
    }
    fetchCalendar();
  }, [supabase, next7Days, calT]);

  const getClassesForDay = (targetDate: Date) => {
    const targetYear = targetDate.getFullYear();
    const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
    const targetDay = String(targetDate.getDate()).padStart(2, '0');
    const targetLocalString = `${targetYear}-${targetMonth}-${targetDay}`;

    return classes.filter(cls => cls.start_time.startsWith(targetLocalString));
  };

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
      alert('Invalid credentials');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('studio_admin_auth');
    setIsAdmin(false);
  };

  const handleSyncCalendar = () => {
    const currentHost = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'webcal://' : 'http://';
    window.location.href = `${protocol}${currentHost}/api/calendar/feed`;
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen pb-20 bg-stone-50 font-sans">
      <nav className="w-full px-8 py-6 flex justify-between items-center border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <Link href={`/${locale}`} className="text-xl tracking-widest font-light uppercase">
          Yoga<span className="font-semibold text-stone-700">Studio</span>
        </Link>
        <div className="flex space-x-6 items-center">
           {isAdmin ? (
             <button onClick={handleAdminLogout} className="text-[10px] text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest font-bold">
               {calT('adminOn')}
             </button>
           ) : (
             <button onClick={() => setShowAuthModal(true)} className="text-[10px] text-stone-300 hover:text-stone-600 transition-colors uppercase tracking-widest">
               {calT('adminOff')}
             </button>
           )}
          <Link href={`/${locale}/booking`} className="text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors">
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
              const dayClasses = getClassesForDay(day);
              const isToday = i === 0;

              return (
                <div key={i} className={`flex-none w-[260px] md:w-auto flex flex-col bg-white rounded-3xl border ${isToday ? 'border-stone-900 shadow-md relative' : 'border-stone-100 shadow-sm'} overflow-hidden snap-center`}>
                  {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-stone-900"></div>}
                  
                  <div className={`p-5 text-center border-b ${isToday ? 'bg-stone-50/50' : 'border-stone-50'}`}>
                    <span className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">
                      {day.toLocaleDateString(locale, { weekday: 'short' })}
                    </span>
                    <span className={`text-3xl font-light ${isToday ? 'text-stone-900' : 'text-stone-600'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="p-4 space-y-3 flex-grow bg-stone-50/20">
                    {dayClasses.length === 0 ? (
                      <div className="h-full min-h-[120px] flex items-center justify-center text-[10px] text-stone-300 uppercase tracking-widest">{calT('empty')}</div>
                    ) : (
                      dayClasses.map((cls) => (
                        <div key={cls.class_id} className={`p-4 rounded-2xl border ${isAdmin ? 'bg-stone-50 border-stone-200' : 'bg-stone-100 border-transparent'} transition-all`}>
                          <p className={`text-sm font-medium ${isAdmin ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                            {new Date(cls.start_time).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          
                          {isAdmin ? (
                            <div className="mt-2">
                              <span className="block text-xs font-mono text-stone-500">{cls.description}</span>
                              <span className="block text-[10px] uppercase tracking-widest text-amber-600 mt-1 font-semibold">{cls.guests?.name || calT('unknown')}</span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className="text-[10px] uppercase tracking-widest text-stone-400">{calT('busy')}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light mb-6 text-center uppercase tracking-widest">{calT('loginTitle')}</h3>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-stone-900 bg-transparent" placeholder={calT('username')} required />
              </div>
              <div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-stone-900 bg-transparent tracking-widest" placeholder={calT('password')} required />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAuthModal(false)} className="flex-1 py-3 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 transition-colors">{calT('cancel')}</button>
                <button type="submit" className="flex-1 py-3 text-xs bg-stone-900 text-white rounded-full uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-md">{calT('login')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}