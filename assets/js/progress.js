// Semester progress, "submitted" marks and exam details.
import { getState, getSubject, getGrades, getTarget, isDone, doneOn, setDone } from './store.js';
import { flatten, leafValue, findItem, needed, evaluate, PASS } from './grades.js';
import { esc, icon, fmt, pct, fmtDate, relDay, daysFrom, toast, openDialog, safeUrl } from './ui.js';

const isExam = (item) => item?.kind === 'exam';
const doneWord = (item) => (isExam(item) ? 'Taken' : 'Submitted');

/** Everything a student has to hand in or sit this semester: graded items and ungraded dates. */
export function semesterItems(st = getState()) {
  const rows = [];
  for (const s of st.subjects) {
    const g = st.grades[s.id] || {};
    for (const n of flatten(s.items).filter((x) => x.isLeaf)) {
      const graded = leafValue(n.item, g[n.item.id]) != null;
      rows.push({ s, item: n.item, date: n.item.date || null, graded, done: graded || isDone(s.id, n.item.id) });
    }
    for (const m of s.milestones || []) {
      rows.push({ s, item: m, date: m.date || null, milestone: true, graded: false, done: isDone(s.id, m.id) });
    }
  }
  // dated first, by date; undated at the end
  return rows.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.s.code.localeCompare(b.s.code));
}

/** True when the item no longer needs any action: graded, or marked as submitted/taken. */
export function isFinished(s, item) {
  if (isDone(s.id, item.id)) return true;
  return leafValue(item, getGrades(s.id)[item.id]) != null;
}

/** The strip of small blocks on the home screen, one per assessment, filled when done. */
export function progressHtml(st = getState()) {
  const rows = semesterItems(st);
  if (!rows.length) return '';
  const done = rows.filter((r) => r.done).length;
  return `
    <div class="progress" id="progress">
      <p class="progress-text"><strong class="num">${done} of ${rows.length}</strong> assessments done this semester</p>
      <div class="progress-strip" role="img" aria-label="${done} of ${rows.length} assessments done">
        ${rows
          .map(
            (r) =>
              `<span class="${r.done ? 'is-done' : ''}" data-color="${esc(r.s.color)}" title="${esc(`${r.s.code}: ${r.item.name}${r.date ? `, ${fmtDate(r.date)}` : ''}${r.done ? (r.graded ? ', graded' : `, ${doneWord(r.item).toLowerCase()}`) : ''}`)}"></span>`,
          )
          .join('')}
      </div>
    </div>`;
}

/** A small toggle to mark an item as submitted (or an exam as taken). Hidden once graded. */
export function doneButton(s, item, { keep = false } = {}) {
  const graded = leafValue(item, getGrades(s.id)[item.id]) != null;
  if (graded && !keep) return '';
  // an exam can only be marked as taken from its day on
  if (isExam(item) && item.date && daysFrom(item.date) > 0 && !isDone(s.id, item.id)) return '';
  const on = isDone(s.id, item.id);
  const word = doneWord(item);
  return `<button type="button" class="done-btn" data-done="${esc(s.id)}|${esc(item.id)}" aria-pressed="${on}" ${graded ? 'hidden' : ''}>
    <span class="done-box" aria-hidden="true">${icon('check')}</span><span class="done-label">${word}</span><span class="sr-only">: ${esc(s.code)} ${esc(item.name)}</span>
  </button>`;
}

/** "Exam details" link for exams. */
export function examButton(s, item) {
  if (!isExam(item)) return '';
  return `<button type="button" class="link-btn" data-exam="${esc(s.id)}|${esc(item.id)}">${icon('info')}Exam details</button>`;
}

function refreshProgress() {
  const el = document.getElementById('progress');
  if (!el) return;
  const box = document.createElement('div');
  box.innerHTML = progressHtml();
  if (box.firstElementChild) el.replaceWith(box.firstElementChild);
}

function applyDone(sid, iid, on) {
  setDone(sid, iid, on);
  document.querySelectorAll(`[data-done="${CSS.escape(`${sid}|${iid}`)}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', String(on));
    b.closest('[data-done-row]')?.classList.toggle('is-done', on);
  });
  refreshProgress();
}

export function openExam(sid, iid) {
  const s = getSubject(sid);
  const item = s && findItem(s.items, iid);
  if (!item) return;
  const g = getGrades(sid);
  const graded = leafValue(item, g[item.id]);
  const frac = flatten(s.items).find((n) => n.item.id === item.id)?.frac ?? 0;
  const x = item.exam || {};
  const target = getTarget(sid);

  let need = '';
  if (graded != null) need = `You got <strong class="num">${fmt(graded)}</strong> in this exam.`;
  else {
    const r = needed(s, g, target);
    const ev = evaluate(s, g);
    const goal = target === PASS ? `pass ${esc(s.code)}` : `finish ${esc(s.code)} with ${target === 8 ? 'an' : 'a'} ${target}`;
    if (r.kind === 'secured') need = `Your ${target} in ${esc(s.code)} is already secured.`;
    else if (r.kind === 'impossible') need = `${target === PASS ? 'Passing' : `A ${target}`} is out of reach on continuous assessment. The most you can still get is <strong class="num">${fmt(r.max)}</strong>.`;
    else
      need = `To ${goal} you need an average of <strong class="num">${fmt(r.x)}</strong> on the remaining ${pct(ev.remainingFrac)}, this exam included.`;
    if (item.min != null && item.min !== '') need += ` This exam also needs at least <strong class="num">${item.min}</strong> on its own.`;
  }

  const facts = [
    ['When', [fmtDate(item.date, { weekday: 'long', day: 'numeric', month: 'long' }), item.time].filter(Boolean).join(', ') + (item.date ? ` (${relDay(item.date)})` : '')],
    ['Where', item.place],
    ['Duration', x.duration],
    ['Format', x.format],
    ['What it covers', x.covers],
    ['Allowed material', x.allowed],
    ['Weight', `${pct(frac)} of the final ${s.code} mark`],
  ].filter(([, v]) => v);
  const missing = !x.format && !x.duration;
  const url = safeUrl(item.url) || safeUrl(s.url);

  const dlg = document.createElement('dialog');
  dlg.className = 'sheet sheet-sm exam-sheet';
  dlg.setAttribute('aria-labelledby', 'exam-title');
  dlg.innerHTML = `
    <div class="sheet-body" data-color="${esc(s.color)}">
      <div class="sheet-top">
        <span class="chip">${esc(s.code)}</span>
        <button type="button" class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button>
      </div>
      <h2 class="sheet-title" id="exam-title">${esc(item.name)}</h2>
      <dl class="exam-facts">
        ${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>
      <p class="exam-need">${need}</p>
      ${
        x.prep?.length
          ? `<div class="exam-prep"><h3>How to prepare</h3><ul>${x.prep.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`
          : ''
      }
      ${missing ? '<p class="muted small">The format of this exam hasn’t been published yet. It will appear here once it is.</p>' : ''}
      <div class="sheet-actions sheet-actions-split">
        ${url ? `<a class="btn btn-ghost btn-sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open the course page${icon('external')}</a>` : '<span></span>'}
        <a class="link" href="#/about" data-act="close">Something wrong? Tell us</a>
      </div>
      ${x.source ? `<p class="muted small">From the ${esc(x.source)}. Always check the official announcement.</p>` : ''}
    </div>`;
  document.body.append(dlg);
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="close"]')) dlg.close();
  });
  dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 0));
  openDialog(dlg);
}

/** One listener for every "Submitted" toggle and "Exam details" button in the app. */
export function wireProgress() {
  document.addEventListener('click', (e) => {
    const exam = e.target.closest('[data-exam]');
    if (exam) {
      e.preventDefault();
      const [sid, iid] = exam.dataset.exam.split('|');
      openExam(sid, iid);
      return;
    }
    const b = e.target.closest('[data-done]');
    if (!b) return;
    e.preventDefault();
    const [sid, iid] = b.dataset.done.split('|');
    const s = getSubject(sid);
    const item = s && (findItem(s.items, iid) || (s.milestones || []).find((m) => m.id === iid));
    if (!item) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    applyDone(sid, iid, on);
    if (on) {
      const rows = semesterItems();
      const done = rows.filter((r) => r.done).length;
      toast(`${doneWord(item)}. ${done} of ${rows.length} done.`, 'neutral', { label: 'Undo', run: () => applyDone(sid, iid, false) });
    }
  });
}

export { doneOn };
