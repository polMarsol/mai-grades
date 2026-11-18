// "Add to calendar": subscribe to the official feed (follows every change), or download a one-off file.
import { getState } from './store.js';
import { catalogById } from './catalog.js';
import { buildICS } from './ics.js';
import { esc, icon, toast, download, openDialog } from './ui.js';

/** Address of a feed, next to the app wherever it is hosted. */
export function feedUrl(id = 'all') {
  return new URL(`calendar/${id}.ics`, location.href.split('#')[0]).href;
}
const webcal = (url) => url.replace(/^https?:/, 'webcal:');
const google = (url) => `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal(url))}`;

export function openCalendarSheet() {
  const st = getState();
  const mine = st.subjects.filter((s) => catalogById[s.id]);
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet sheet-sm cal-sheet';
  dlg.setAttribute('aria-labelledby', 'cal-title');
  dlg.innerHTML = `
    <div class="sheet-body">
      <div class="sheet-top">
        <h2 class="sheet-title" id="cal-title">Add the dates to your calendar</h2>
        <button type="button" class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button>
      </div>

      <section class="cal-opt" aria-labelledby="cal-sub">
        <h3 id="cal-sub">Subscribe <span class="cal-badge">Recommended</span></h3>
        <p class="muted small">Add it once and your calendar keeps up: when a date changes here, it moves there too, with a reminder the day before.</p>
        <label class="field cal-which">
          <span class="field-label">Subjects</span>
          <select id="cal-feed">
            <option value="all">All six subjects, in one calendar</option>
            ${mine.map((s) => `<option value="${esc(s.id)}">${esc(s.code)} only</option>`).join('')}
          </select>
        </label>
        <div class="cal-buttons">
          <a class="btn btn-primary" id="cal-google" target="_blank" rel="noopener">Google Calendar</a>
          <a class="btn btn-ghost" id="cal-apple">Apple Calendar</a>
          <button type="button" class="btn btn-ghost" id="cal-copy">${icon('copy')}Copy link</button>
        </div>
        <p class="muted small cal-note">Google checks for changes every few hours, so a moved date can take up to a day to show. For Outlook, copy the link and add it as a calendar “From the web”. The feed has the official dates, not your own edits.</p>
      </section>

      <section class="cal-opt" aria-labelledby="cal-file">
        <h3 id="cal-file">Download a file</h3>
        <p class="muted small">A copy of your dates as they are now, your own edits included. It will not follow later changes.</p>
        <div class="cal-buttons">
          <button type="button" class="btn btn-ghost" id="cal-dl">${icon('download')}Download .ics</button>
        </div>
      </section>
    </div>`;
  document.body.append(dlg);

  const select = dlg.querySelector('#cal-feed');
  const sync = () => {
    const url = feedUrl(select.value);
    dlg.querySelector('#cal-google').href = google(url);
    dlg.querySelector('#cal-apple').href = webcal(url);
  };
  select.addEventListener('change', sync);
  sync();
  dlg.querySelector('#cal-copy').addEventListener('click', async () => {
    const url = feedUrl(select.value);
    try {
      await navigator.clipboard.writeText(url);
      toast('Calendar link copied');
    } catch {
      prompt('Copy this link', url);
    }
  });
  dlg.querySelector('#cal-dl').addEventListener('click', () => {
    download('mai-deadlines.ics', buildICS(getState().subjects), 'text/calendar');
    toast('Calendar file downloaded');
  });
  dlg.addEventListener('click', (e) => e.target.closest('[data-act="close"]') && dlg.close());
  dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 0));
  openDialog(dlg);
}
