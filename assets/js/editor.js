// Structure editor: rename items, change weights, dates and minimums,
// add or remove items. Works on a copy and saves on confirm.
import { saveSubject, removeSubject, resetStructure } from './store.js';
import { catalogById, COLORS } from './catalog.js';
import { flatten } from './grades.js';
import { esc, icon, openDialog, confirmDialog, toast, pctFine } from './ui.js';

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

function findParentList(items, id) {
  for (const it of items) {
    if (it.id === id) return items;
    if (it.children?.length) {
      const f = findParentList(it.children, id);
      if (f) return f;
    }
  }
  return null;
}

function rowHtml(it, depth, fracs) {
  const isGroup = !!it.children?.length;
  return `
  <li class="ed-item${isGroup ? ' is-group' : ''}" data-id="${esc(it.id)}" style="--d:${depth}">
    <div class="ed-row">
      <input class="ed-name" data-f="name" value="${esc(it.name)}" aria-label="Name" required>
      <label class="ed-field"><span>Weight</span><input class="num" data-f="weight" inputmode="decimal" value="${esc(it.weight)}"></label>
      <span class="ed-share muted num" data-share>${pctFine(fracs[it.id] || 0)}</span>
      <label class="ed-field"><span>Min</span><input class="num" data-f="min" inputmode="decimal" placeholder="–" value="${esc(it.min ?? '')}"></label>
      ${isGroup ? '<span class="ed-field ed-blank"></span>' : `<label class="ed-field"><span>Date</span><input type="date" data-f="date" value="${esc(it.date ?? '')}"></label>`}
      <div class="ed-actions">
        ${isGroup ? '' : `<label class="mini-check" title="Resubmitted work is capped at 8"><input type="checkbox" data-f="retake" ${it.retake ? 'checked' : ''}> Resubmit max 8</label>`}
        <button type="button" class="icon-btn" data-act="child" aria-label="Add sub-item to ${esc(it.name)}">${icon('plus')}</button>
        <button type="button" class="icon-btn" data-act="del" aria-label="Remove ${esc(it.name)}">${icon('trash')}</button>
      </div>
    </div>
    ${isGroup ? `<ul class="ed-list">${it.children.map((c) => rowHtml(c, depth + 1, fracs)).join('')}</ul>` : ''}
  </li>`;
}

export function openEditor(subject, onSaved) {
  const draft = structuredClone(subject);
  const official = catalogById[subject.id];

  const dlg = document.createElement('dialog');
  dlg.className = 'sheet';
  dlg.setAttribute('aria-labelledby', 'ed-title');
  document.body.append(dlg);

  const fracMap = () => Object.fromEntries(flatten(draft.items).map((n) => [n.item.id, n.frac]));

  function render() {
    const fracs = fracMap();
    dlg.innerHTML = `
      <form class="sheet-body" novalidate>
        <div class="sheet-top">
          <h2 class="sheet-title" id="ed-title">Edit ${esc(draft.code)}</h2>
          <button type="button" class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button>
        </div>
        <div class="ed-meta">
          <label class="field"><span>Code</span><input data-m="code" value="${esc(draft.code)}" maxlength="8" required></label>
          <label class="field field-wide"><span>Name</span><input data-m="name" value="${esc(draft.name)}" required></label>
          <label class="field"><span>University</span><input data-m="university" value="${esc(draft.university)}" maxlength="12"></label>
          <label class="field"><span>ECTS</span><input data-m="ects" inputmode="decimal" value="${esc(draft.ects)}"></label>
        </div>
        <fieldset class="swatches">
          <legend>Colour</legend>
          ${COLORS.map(
            (c) => `<label class="swatch" data-color="${c}"><input type="radio" name="color" value="${c}" ${draft.color === c ? 'checked' : ''}><span class="sr-only">${c}</span></label>`,
          ).join('')}
        </fieldset>
        <p class="muted small">Weights are relative to the items next to them, so 35 / 35 / 30 and 1 / 1 / 1 both work. The percentage shows each item's share of the final mark. Min is the grade an item must reach to pass the subject.</p>
        <ul class="ed-list ed-root">${draft.items.map((it) => rowHtml(it, 0, fracs)).join('')}</ul>
        <button type="button" class="btn btn-ghost btn-sm" data-act="add">${icon('plus')}Add item</button>
        <p class="form-error" id="ed-error" role="alert"></p>
        <div class="sheet-actions sheet-actions-split">
          <div>
            ${official ? `<button type="button" class="btn btn-ghost" data-act="reset">${icon('reset')}Restore official guide</button>` : ''}
            <button type="button" class="btn btn-ghost btn-danger-text" data-act="remove">${icon('trash')}Remove subject</button>
          </div>
          <div>
            <button type="button" class="btn btn-ghost" data-act="close">Cancel</button>
            <button type="submit" class="btn btn-primary">Save changes</button>
          </div>
        </div>
      </form>`;
  }

  const byId = (id) => findParentList(draft.items, id)?.find((x) => x.id === id);

  dlg.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.m) {
      draft[t.dataset.m] = t.dataset.m === 'ects' ? Number(String(t.value).replace(',', '.')) || 0 : t.value;
      if (t.dataset.m === 'code') dlg.querySelector('#ed-title').textContent = `Edit ${t.value || 'subject'}`;
      return;
    }
    if (t.name === 'color') {
      draft.color = t.value;
      return;
    }
    const li = t.closest('.ed-item');
    if (!li || !t.dataset.f) return;
    const it = byId(li.dataset.id);
    const f = t.dataset.f;
    if (f === 'weight') it.weight = Number(String(t.value).replace(',', '.')) || 0;
    else if (f === 'min') {
      const v = String(t.value).trim().replace(',', '.');
      if (v === '') delete it.min;
      else it.min = Number(v);
    } else if (f === 'date') {
      if (t.value) it.date = t.value;
      else delete it.date;
    } else if (f === 'retake') {
      if (t.checked) it.retake = 8;
      else delete it.retake;
    } else it[f] = t.value;
    if (f === 'weight') {
      const fr = fracMap();
      dlg.querySelectorAll('.ed-item').forEach((el) => {
        el.querySelector(':scope > .ed-row [data-share]').textContent = pctFine(fr[el.dataset.id] || 0);
      });
    }
  });

  dlg.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const li = btn.closest('.ed-item');
    if (act === 'close') return dlg.close();
    if (act === 'add') {
      draft.items.push({ id: uid(draft.id), name: 'New item', weight: 10 });
      render();
      dlg.querySelector('.ed-root > .ed-item:last-child .ed-name').select();
    }
    if (act === 'child') {
      const it = byId(li.dataset.id);
      it.children ||= [];
      if (!it.children.length) {
        // turning a gradable item into a group: drop item-only fields
        delete it.date;
        delete it.retake;
      }
      it.children.push({ id: uid(draft.id), name: 'New item', weight: 1 });
      render();
      dlg.querySelector(`[data-id="${CSS.escape(it.id)}"] > .ed-list > .ed-item:last-child .ed-name`)?.select();
    }
    if (act === 'del') {
      const list = findParentList(draft.items, li.dataset.id);
      list.splice(list.findIndex((x) => x.id === li.dataset.id), 1);
      // a group that lost its last child becomes a gradable item again
      const clean = (items) =>
        items.forEach((x) => {
          if (x.children && !x.children.length) delete x.children;
          else if (x.children) clean(x.children);
        });
      clean(draft.items);
      render();
    }
    if (act === 'reset') {
      const ok = await confirmDialog({
        title: 'Restore the official structure?',
        body: 'Your changes to items and weights are replaced by the course guide. Grades for items that still exist are kept.',
        confirm: 'Restore',
      });
      if (ok) {
        resetStructure(subject.id);
        dlg.close();
        toast('Official structure restored');
        onSaved?.();
      }
    }
    if (act === 'remove') {
      const ok = await confirmDialog({
        title: `Remove ${subject.code}?`,
        body: 'The subject and all its grades are deleted from this device.',
        confirm: 'Remove subject',
        danger: true,
      });
      if (ok) {
        removeSubject(subject.id);
        dlg.close();
        toast(`${subject.code} removed`);
        location.hash = '#/';
      }
    }
  });

  dlg.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = dlg.querySelector('#ed-error');
    const flat = flatten(draft.items);
    if (!String(draft.code).trim() || !String(draft.name).trim()) return (err.textContent = 'Add a code and a name for the subject.');
    if (!draft.items.length) return (err.textContent = 'Add at least one item.');
    if (flat.some((n) => !String(n.item.name).trim())) return (err.textContent = 'Every item needs a name.');
    if (flat.some((n) => !(Number(n.item.weight) > 0))) return (err.textContent = 'Every weight must be greater than 0.');
    if (flat.some((n) => n.item.min != null && !(n.item.min >= 0 && n.item.min <= 10)))
      return (err.textContent = 'Minimum grades go from 0 to 10.');
    draft.code = String(draft.code).trim().toUpperCase();
    saveSubject(draft);
    dlg.close();
    toast('Changes saved');
    onSaved?.();
  });

  dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 0));
  render();
  openDialog(dlg);
}
