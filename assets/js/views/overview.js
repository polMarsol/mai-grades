import { getState, getGrades, isDone } from '../store.js';
import { evaluate, weightedMean, datedItems, leafValue } from '../grades.js';
import { esc, fmt, pct, scale, statusPill, icon, countTo, download, toast, fmtDate, daysFrom } from '../ui.js';
import { upcoming, deadlineRow } from './home.js';
import { buildICS } from '../ics.js';

export function renderOverview(root) {
  const st = getState();
  const rows = st.subjects.map((s) => ({ s, ev: evaluate(s, getGrades(s.id)) }));
  const avg = weightedMean(rows.map(({ s, ev }) => ({ value: ev.average, ects: s.ects })));
  const proj = weightedMean(rows.map(({ s, ev }) => ({ value: ev.projected, ects: s.ects })));
  const ects = rows.reduce((a, { s }) => a + (Number(s.ects) || 0), 0);
  const graded = ects ? rows.reduce((a, { s, ev }) => a + ev.gradedFrac * (Number(s.ects) || 0), 0) / ects : 0;

  const next = upcoming(st.subjects, Infinity);
  const waiting = [];
  for (const s of st.subjects) {
    const g = getGrades(s.id);
    for (const n of datedItems(s)) {
      if (!n.isLeaf || leafValue(n.item, g[n.item.id]) != null) continue;
      // past its date, or handed in early
      if (daysFrom(n.date) < 0 || isDone(s.id, n.item.id)) waiting.push({ s, n });
    }
  }
  waiting.sort((a, b) => b.n.date.localeCompare(a.n.date));

  // group upcoming by month
  const months = new Map();
  for (const r of next) {
    const k = r.n.date.slice(0, 7);
    if (!months.has(k)) months.set(k, []);
    months.get(k).push(r);
  }

  if (!rows.length) {
    root.innerHTML = `
      <section class="empty">
        <h1 class="display">Overview</h1>
        <p class="lede">Add a subject to see your semester at a glance.</p>
        <a class="btn btn-primary" href="#/settings?add=1">${icon('plus')}Add a subject</a>
      </section>`;
    return;
  }

  root.innerHTML = `
    <h1 class="display">Overview</h1>

    <section class="card summary" aria-label="Semester summary">
      <div class="figure">
        <span class="figure-num num" id="ov-avg" data-v="">–</span>
        <span class="figure-label">Current average</span>
      </div>
      <div class="figure">
        <span class="figure-num num" id="ov-proj" data-v="">–</span>
        <span class="figure-label">Projected average</span>
      </div>
      <div class="figure">
        <span class="figure-num num">${pct(graded)}</span>
        <span class="figure-label">Of the semester graded</span>
      </div>
      <p class="summary-note muted small">Averages are weighted by ECTS across ${ects} credits.</p>
    </section>

    <section class="block" aria-labelledby="h-subjects">
      <div class="block-head"><h2 class="section-title" id="h-subjects">By subject</h2></div>
      <div class="card table-card">
        <table class="strip">
          <caption class="sr-only">Grades by subject on a 0 to 10 scale</caption>
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col" class="col-scale"><span class="axis" aria-hidden="true"><span>0</span><span>5</span><span>10</span></span><span class="sr-only">Scale</span></th>
              <th scope="col" class="num-col">Average</th>
              <th scope="col" class="num-col">Projected</th>
              <th scope="col" class="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                ({ s, ev }, i) => `
              <tr data-color="${esc(s.color)}">
                <th scope="row"><a href="#/s/${esc(s.id)}"><span class="code-dot" aria-hidden="true"></span>${esc(s.code)}</a><span class="muted small">${pct(ev.gradedFrac)} graded</span></th>
                <td class="col-scale">${scale(ev, { label: s.code })}</td>
                <td class="num-col num" data-l="Average">${fmt(ev.average)}</td>
                <td class="num-col num" data-l="Projected">${fmt(ev.projected)}</td>
                <td class="col-status">${statusPill(ev.status)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
        <ul class="legend" aria-hidden="true">
          <li><span class="key key-secured"></span>Secured</li>
          <li><span class="key key-reach"></span>Still in play</li>
          <li><span class="key key-proj"></span>Projected</li>
        </ul>
      </div>
    </section>

    ${
      waiting.length
        ? `<section class="block" aria-labelledby="h-wait">
            <div class="block-head"><h2 class="section-title" id="h-wait">Waiting for a grade</h2></div>
            <ul class="deadlines">${waiting.map(deadlineRow).join('')}</ul>
          </section>`
        : ''
    }

    <section class="block" aria-labelledby="h-dl">
      <div class="block-head">
        <h2 class="section-title" id="h-dl">Deadlines</h2>
        <button class="btn btn-ghost btn-sm" type="button" id="ics">${icon('calendar')}Add to calendar</button>
      </div>
      ${
        next.length
          ? [...months.entries()]
              .map(
                ([k, list]) => `
          <h3 class="month">${fmtDate(`${k}-01`, { month: 'long', year: 'numeric' })}</h3>
          <ul class="deadlines">${list.map(deadlineRow).join('')}</ul>`,
              )
              .join('')
          : '<p class="muted">No upcoming dates. Add them with Edit structure on each subject.</p>'
      }
    </section>`;

  countTo(root.querySelector('#ov-avg'), avg);
  countTo(root.querySelector('#ov-proj'), proj);

  root.querySelector('#ics').addEventListener('click', () => {
    download('mai-deadlines.ics', buildICS(st.subjects), 'text/calendar');
    toast('Calendar file downloaded');
  });
}
