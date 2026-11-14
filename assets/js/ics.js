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
const fold = (line) => {
  const out = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  out.push(rest);
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
        fold(`DESCRIPTION:${escText(n.isMilestone ? `${s.name}. Not graded.` : `${share}% of the final ${s.code} mark (${s.name}).`)}`),
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
