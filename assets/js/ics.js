// Build an iCalendar file with every dated delivery and exam.
import { datedItems } from './grades.js';

const pad = (n) => String(n).padStart(2, '0');
const icsDate = (iso) => iso.replaceAll('-', '');
const nextDay = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`;
};
const escText = (s) => String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
// lines longer than 75 octets continue on the next line, without splitting a character
const enc = new TextEncoder();
const fold = (line) => {
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ' ';
      bytes = 1;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
};

export function buildICS(subjects) {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MAI Grades//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:MAI deadlines'];
  for (const s of subjects) {
    for (const n of datedItems(s)) {
      const share = Math.round(n.frac * 1000) / 10;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${n.item.id}-${n.date}@mai-grades`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${icsDate(n.date)}`,
        `DTEND;VALUE=DATE:${nextDay(n.date)}`,
        fold(`SUMMARY:${escText(`${s.code}: ${n.item.name}`)}`),
        fold(
          `DESCRIPTION:${escText(
            [n.item.time, n.isMilestone ? `${s.name}. Not graded.` : `${share}% of the final ${s.code} mark (${s.name}).`].filter(Boolean).join('. '),
          )}`,
        ),
        ...(n.item.place ? [fold(`LOCATION:${escText(n.item.place)}`)] : []),
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

/* ---------- Subscription feeds ---------- */
// Published as static files in /calendar, built from the catalog by tools/build-calendars.mjs.
// UIDs do not include the date, so when a date moves the event moves in every subscribed calendar.

const TZ = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Madrid',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** "11:00" or "11:00–13:00" → start and end; "by 23:55" and anything else → null (all-day). */
export function parseSlot(time) {
  const m = /^\s*(\d{1,2}):(\d{2})(?:\s*[–-]\s*(\d{1,2}):(\d{2}))?\s*$/.exec(time || '');
  if (!m) return null;
  const start = `${pad(m[1])}${m[2]}00`;
  const end = m[3] ? `${pad(m[3])}${m[4]}00` : `${pad((Number(m[1]) + 2) % 24)}${m[2]}00`;
  return { start, end };
}

/**
 * A calendar to subscribe to. `subjects` are catalog subjects; `stamp` is a YYYY-MM-DD
 * date so the same catalog always gives the same file; `site` is the app's address.
 */
export function buildFeed(subjects, { name, stamp, site }) {
  const dtstamp = `${icsDate(stamp)}T000000Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MAI Grades//Calendar feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    fold(`X-WR-CALNAME:${escText(name)}`),
    fold(`X-WR-CALDESC:${escText('Deliveries and exams from the MAI course guides. Updated by MAI Grades.')}`),
    'X-WR-TIMEZONE:Europe/Madrid',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
    ...TZ,
  ];
  for (const s of subjects) {
    for (const n of datedItems(s)) {
      const it = n.item;
      const slot = parseSlot(it.time);
      const due = !slot && it.time ? ` (${it.time.replace(/^by /, 'due ')})` : '';
      const what = n.isMilestone ? `${s.name}. Not graded.` : `${Math.round(n.frac * 1000) / 10}% of the final ${s.code} mark (${s.name}).`;
      const link = `${site}#/s/${encodeURIComponent(s.id)}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${s.id}-${it.id}@mai-grades`,
        `DTSTAMP:${dtstamp}`,
        ...(slot
          ? [`DTSTART;TZID=Europe/Madrid:${icsDate(n.date)}T${slot.start}`, `DTEND;TZID=Europe/Madrid:${icsDate(n.date)}T${slot.end}`]
          : [`DTSTART;VALUE=DATE:${icsDate(n.date)}`, `DTEND;VALUE=DATE:${nextDay(n.date)}`]),
        fold(`SUMMARY:${escText(`${s.code}: ${it.name}${due}`)}`),
        fold(`DESCRIPTION:${escText([it.time, what, it.url ? `Task: ${it.url}` : '', `Your grades: ${link}`].filter(Boolean).join('\n'))}`),
        ...(it.place ? [fold(`LOCATION:${escText(it.place)}`)] : []),
        fold(`URL:${it.url || link}`),
        n.isMilestone ? 'CATEGORIES:Milestone' : it.kind === 'exam' ? 'CATEGORIES:Exam' : 'CATEGORIES:Delivery',
        'TRANSP:TRANSPARENT',
        // a reminder the day before (calendars that allow alarms on subscriptions show it)
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        fold(`DESCRIPTION:${escText(`${s.code}: ${it.name}`)}`),
        slot ? 'TRIGGER:-P1D' : 'TRIGGER:-PT15H',
        'END:VALARM',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
