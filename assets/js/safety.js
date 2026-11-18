// Keeping grades safe: they only live in this browser, so we ask it to keep them,
// warn where Safari may clear them, and nudge for a backup once there is something to lose.
import { getState, exportData } from './store.js';
import { download, toast } from './ui.js';

const BACKUP = 'mai-grades:backup'; // { at: 'YYYY-MM-DD', count }
const SNOOZE = 'mai-grades:safety-snooze'; // { ios: 'YYYY-MM-DD', backup: 'YYYY-MM-DD' }

const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};
const isoDay = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** How many grades the student has typed, across all subjects. */
export function gradeCount() {
  if (getState().demo) return 0; // the example's grades are not the student's to lose
  const g = getState().grades || {};
  return Object.values(g).reduce((a, sub) => a + Object.values(sub || {}).filter((x) => x && x.v != null).length, 0);
}

/** Ask the browser not to clear this site's storage when space runs low. Silent either way. */
export async function askToKeep() {
  try {
    if (!gradeCount() || !navigator.storage?.persist) return;
    if (await navigator.storage.persisted()) return;
    await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}

export function saveBackup() {
  download(`mai-grades-${isoDay()}.json`, exportData(), 'application/json');
  write(BACKUP, { at: isoDay(), count: gradeCount() });
  toast('Backup downloaded');
}

const snoozed = (key) => {
  const s = read(SNOOZE) || {};
  return s[key] && s[key] > isoDay();
};
const snooze = (key, days) => write(SNOOZE, { ...(read(SNOOZE) || {}), [key]: isoDay(days) });

/** iPhone or iPad Safari, not installed, with grades to lose. */
export const needsIOSWarning = () => isIOS() && !isStandalone() && gradeCount() > 0 && !snoozed('ios');

/** Five or more grades, and five new ones since the last backup (or none yet). */
export function needsBackup() {
  const n = gradeCount();
  if (n < 5 || snoozed('backup')) return false;
  const last = read(BACKUP);
  return !last || n - last.count >= 5;
}

/** The card for the Home slot, or '' when nothing needs saying. */
export function safetyCard() {
  if (needsIOSWarning())
    return {
      kind: 'ios',
      html: `<p><strong>Keep your grades on this iPhone.</strong> Safari can clear a website's data after a week without visits. Add MAI Grades to your Home Screen to keep them: tap Share, then “Add to Home Screen”.</p>`,
    };
  if (needsBackup()) {
    const n = gradeCount();
    return {
      kind: 'backup',
      html: `<p><strong>Your ${n} grades live only on this device.</strong> Save a backup file in case you change or lose it.</p>`,
    };
  }
  return null;
}

export function mountSafety(slot, card) {
  slot.innerHTML = `
    <div class="install install-safety" data-kind="${card.kind}">
      ${card.html}
      <button class="btn btn-ghost btn-sm" type="button" data-backup>Save a backup</button>
      <button class="icon-btn" type="button" data-later aria-label="Remind me later">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>`;
  slot.querySelector('[data-backup]').addEventListener('click', () => {
    saveBackup();
    if (card.kind === 'backup') slot.innerHTML = '';
  });
  slot.querySelector('[data-later]').addEventListener('click', () => {
    snooze(card.kind, card.kind === 'ios' ? 7 : 14);
    slot.innerHTML = '';
  });
}
