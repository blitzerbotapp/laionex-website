/**
 * Cloudflare Worker: Kalender-Availability
 *
 * Route /slots: Cal.com-Proxy (API-Key geschützt)
 *   GET /slots?date=2026-03-16
 *   Env: CAL_COM_API_KEY, CAL_COM_USERNAME, CAL_COM_EVENT_SLUG
 *
 * Route /: ICS-Feed (falls ICS_URL gesetzt)
 *   GET /?date=2026-03-16
 *   Env: ICS_URL
 */

const SLOT_TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    let dateStr = url.searchParams.get('date');

    if (!dateStr && request.method === 'POST') {
      try {
        const body = await request.json();
        dateStr = body?.date;
      } catch (_) {}
    }

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return jsonResponse({ error: 'date required (YYYY-MM-DD)' }, 400);
    }

    // Cal.com Proxy – API-Key bleibt im Worker
    if (path === '/slots' && env.CAL_COM_API_KEY && env.CAL_COM_USERNAME && env.CAL_COM_EVENT_SLUG) {
      const [y, mo, d] = dateStr.split('-').map(Number);
      const nextDay = new Date(y, mo - 1, d + 1);
      const endStr = nextDay.getFullYear() + '-' + String(nextDay.getMonth() + 1).padStart(2, '0') + '-' + String(nextDay.getDate()).padStart(2, '0');
      const calUrl = `https://api.cal.com/v2/slots?eventTypeSlug=${encodeURIComponent(env.CAL_COM_EVENT_SLUG)}&username=${encodeURIComponent(env.CAL_COM_USERNAME)}&start=${dateStr}&end=${endStr}&timeZone=Europe%2FVienna`;
      try {
        const res = await fetch(calUrl, {
          headers: { 'cal-api-version': '2024-09-04', 'Authorization': 'Bearer ' + env.CAL_COM_API_KEY },
        });
        const json = await res.json();
        const data = res.ok ? json : { data: {} };
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      } catch (e) {
        return jsonResponse({ error: 'Cal.com unavailable', data: {} }, 502);
      }
    }

    // ICS-Feed
    const icsUrl = env.ICS_URL;
    if (!icsUrl) {
      return jsonResponse({ error: 'ICS_URL or Cal.com not configured' }, 500);
    }

    try {
      const res = await fetch(icsUrl, {
        headers: { 'User-Agent': 'Laionex-Calendar-Worker/1.0' },
      });
      if (!res.ok) throw new Error('ICS fetch failed');
      const ics = await res.text();
      const busy = parseIcsForDate(ics, dateStr);
      return jsonResponse({ busy });
    } catch (e) {
      return jsonResponse({ error: 'Calendar unavailable', busy: [] }, 200);
    }
  },
};

function parseIcsForDate(ics, dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const targetDayStart = targetDate.getTime();
  const targetDayEnd = targetDayStart + 24 * 60 * 60 * 1000;

  const events = [];
  const veventRe = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gi;
  let match;
  while ((match = veventRe.exec(ics)) !== null) {
    const block = match[0];
    const transp = block.match(/TRANSP:(OPAQUE|TRANSPARENT)/i)?.[1];
    if (transp === 'TRANSPARENT') continue;

    const dtstartRaw = block.match(/DTSTART(?:;[^:]*)?:([^\r\n]+)/i)?.[1]?.trim();
    const dtendRaw = block.match(/DTEND(?:;[^:]*)?:([^\r\n]+)/i)?.[1]?.trim();
    if (!dtstartRaw) continue;

    const isDateOnly = /VALUE=DATE/i.test(block) || /^\d{8}$/.test(dtstartRaw.replace(/[-:TZ]/g, ''));
    let start, end;
    if (isDateOnly) {
      const d = parseIcsDateOnly(dtstartRaw);
      const e = dtendRaw ? parseIcsDateOnly(dtendRaw) : d + 24 * 60 * 60 * 1000;
      start = d; end = e;
    } else {
      start = parseIcsDateTime(dtstartRaw.replace(/[TZ]/g, ''), y, m);
      end = dtendRaw ? parseIcsDateTime(dtendRaw.replace(/[TZ]/g, ''), y, m) : start + 60 * 60 * 1000;
    }
    if (end <= targetDayStart || start >= targetDayEnd) continue;
    events.push({ start, end });
  }

  const busySlots = new Set();
  for (const slot of SLOT_TIMES) {
    const [h, min] = slot.split(':').map(Number);
    const slotStart = targetDayStart + (h * 60 + min) * 60 * 1000;
    const slotEnd = slotStart + 30 * 60 * 1000;
    const overlaps = events.some(ev => ev.start < slotEnd && ev.end > slotStart);
    if (overlaps) busySlots.add(slot);
  }
  return [...busySlots].sort();
}

function parseIcsDateOnly(str) {
  const s = String(str).replace(/[TZ\-:]/g, '').slice(0, 8);
  if (s.length < 8) return 0;
  const y = parseInt(s.slice(0, 4), 10), mo = parseInt(s.slice(4, 6), 10) - 1, d = parseInt(s.slice(6, 8), 10);
  return new Date(y, mo, d, 0, 0, 0).getTime();
}

function parseIcsDateTime(str, defaultYear, defaultMonth) {
  str = String(str).replace(/[TZ]/g, '');
  const y = str.length >= 8 ? parseInt(str.slice(0, 4), 10) : defaultYear;
  const mo = str.length >= 8 ? parseInt(str.slice(4, 6), 10) - 1 : defaultMonth - 1;
  const d = str.length >= 8 ? parseInt(str.slice(6, 8), 10) : 1;
  const h = str.length >= 14 ? parseInt(str.slice(9, 11), 10) : 0;
  const min = str.length >= 14 ? parseInt(str.slice(11, 13), 10) : 0;
  const sec = str.length >= 14 ? parseInt(str.slice(13, 15), 10) : 0;
  return new Date(y, mo, d, h, min, sec).getTime();
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
