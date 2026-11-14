// Opened from a "share this grade with your team" link: #/add?s=<subject>&i=<item>&v=<grade>
// Nothing is saved until the person confirms.
import { getSubject, getGrades, addFromCatalog, setGrade } from '../store.js';
import { catalogById } from '../catalog.js';
import { findItem, itemPath, parseGrade } from '../grades.js';
import { esc, fmt, go, toast } from '../ui.js';

export function renderAdd(root, params) {
  const mine = getSubject(params.s);
  const subject = mine || catalogById[params.s];
  const item = subject && findItem(subject.items, params.i);
  const v = parseGrade(params.v);

  if (!subject || !item || item.children?.length || v == null || Number.isNaN(v)) {
    root.innerHTML = `
      <section class="empty">
        <h1 class="display">This link can't be used</h1>
        <p class="lede">It doesn't match a subject and item on this device. Ask your teammate to share it again.</p>
        <a class="btn btn-primary" href="#/">Go to your subjects</a>
      </section>`;
    return;
  }

  const path = itemPath(subject.items, item.id).slice(-2).join(', ');
  const current = getGrades(subject.id)[item.id]?.v;
  root.innerHTML = `
    <section class="add-page" data-color="${esc(subject.color)}">
      <h1 class="display">Add this grade?</h1>
      <p class="lede">A teammate shared a grade with you. It is saved only on this device.</p>
      <div class="card add-card">
        <div>
          <p class="chip">${esc(subject.code)}</p>
          <p class="add-item">${esc(path)}</p>
          ${current != null && current !== v ? `<p class="muted small">Replaces your current grade of ${fmt(current)}.</p>` : ''}
          ${!mine ? `<p class="muted small">${esc(subject.code)} will be added to your subjects.</p>` : ''}
        </div>
        <p class="add-num num">${fmt(v)}</p>
      </div>
      <div class="pick-actions">
        <button class="btn btn-primary btn-lg" type="button" id="add-ok">Add grade</button>
        <a class="btn btn-ghost btn-lg" href="#/">Not now</a>
      </div>
    </section>`;

  root.querySelector('#add-ok').addEventListener('click', () => {
    if (!mine) addFromCatalog(subject.id);
    setGrade(subject.id, item.id, v);
    toast('Grade added');
    go(`#/s/${subject.id}`);
  });
}
