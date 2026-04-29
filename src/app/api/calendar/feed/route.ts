import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const formatICSDate = (date: Date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
    
    if (!supabaseUrl || !supabaseKey) {
      return new NextResponse('Server Configuration Error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch classes and guests separately to avoid PGRST200
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .gte('start_time', today)
      .order('start_time', { ascending: true });

    const { data: guestData, error: guestError } = await supabase
      .from('guests')
      .select('guest_id, name');

    if (classError || guestError) {
      throw classError || guestError;
    }

    const guestMap = new Map(guestData?.map(g => [g.guest_id.trim(), g.name]));
    
    const safeClasses = (classData || []).map(cls => ({
      ...cls,
      guests: { name: guestMap.get(cls.guest_id?.trim()) || 'Unknown' }
    }));

    // ADDED: Auto-refresh instructions for Mac/iOS Calendar (15 Minute TTL)
    let icsString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Yoga x Chang//Calendar//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-PUBLISHED-TTL:PT15M',
      'REFRESH-INTERVAL;VALUE=DURATION:PT15M'
    ].join('\r\n') + '\r\n';

    safeClasses.forEach((cls) => {
      const startDate = new Date(cls.start_time);
      const endDate = new Date(cls.end_time);
      const now = new Date();

      icsString += [
        'BEGIN:VEVENT',
        `UID:class_${cls.class_id}@yogastudio.com`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:Yoga: ${cls.description} (${cls.guests?.name})`,
        `DESCRIPTION:Mã lớp: ${cls.description}\\nHọc viên: ${cls.guests?.name}\\nID: ${cls.guest_id}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: Upcoming Yoga Session',
        'END:VALARM',
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    });

    icsString += 'END:VCALENDAR';

    return new NextResponse(icsString, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="yoga_schedule.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate', 
      },
    });

  } catch (err: any) {
    console.error('Calendar Feed Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}