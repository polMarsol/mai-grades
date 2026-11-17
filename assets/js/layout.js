// Home layout: which blocks show, and in what order. Presets or the student's own.
import { getState, setLayout } from './store.js';
import { esc, icon, openDialog } from './ui.js';

export const BLOCKS = [
  { id: 'calendar', name: 'Calendar', desc: 'Every date of the semester, by month or week' },
  { id: 'next', name: 'Next up', desc: 'Countdowns to your next deadlines' },
  { id: 'subjects', name: 'Your subjects', desc: 'A card per subject with your grade so far' },
  { id: 'news', name: 'Course news', desc: 'Recent changes to dates and weights' },
];
const IDS = BLOCKS.map((b) => b.id);

export const PRESETS = {
  dates: { name: 'Dates first', desc: 'Calendar and deadlines on top', order: ['calendar', 'next', 'subjects', 'news'], hidden: [] },
  grades: { name: 'Grades first', desc: 'Your subjects on top', order: ['subjects', 'next', 'calendar', 'news'], hidden: [] },
  essentials: {
    name: 'Essentials',
    desc: 'Only what is next and your grades',
    order: ['next', 'subjects', 'calendar', 'news'],
    hidden: ['calendar', 'news', 'progress'],
  },
};

const fromPreset = (id) => ({ preset: id, order: [...PRESETS[id].order], hidden: [...PRESETS[id].hidden] });

/** The current layout, always complete: every block appears once in `order`. */
export function getLayout() {
  const saved = getState().layout;
  if (!saved || !Array.isArray(saved.order)) return fromPreset('dates');
  const order = saved.order.filter((id) => IDS.includes(id));
  for (const id of IDS) if (!order.includes(id)) order.push(id);
  const hidden = (saved.hidden || []).filter((id) => IDS.includes(id) || id === 'progress');
  const preset = PRESETS[saved.preset] ? saved.preset : 'custom';
  return { preset, order, hidden };
}

export const isShown = (layout, id) => !layout.hidden.includes(id);

/** If the layout matches a preset exactly, name it after that preset. */
function settle(layout) {
  for (const [id, p] of Object.entries(PRESETS)) {
    const same = p.order.join() === layout.order.join() && [...p.hidden].sort().join() === [...layout.hidden].sort().join();
    if (same) return { ...layout, preset: id };
  }
  return { ...layout, preset: 'custom' };
}

/** A tiny drawing of the layout for the preset cards. */
function sketch(layout) {
  const shown = layout.order.filter((id) => !layout.hidden.includes(id));
  return `<span class="sketch" aria-hidden="true">${shown
    .map((id) => `<i class="sk-${id}"></i>`)
    .join('')}</span>`;
}

/** The Customize sheet. `onChange` re-renders Home behind it so changes show live. */
export function openCustomize(onChange = () => {}) {
  let layout = getLayout();
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet sheet-sm customize';
  dlg.setAttribute('aria-labelledby', 'cz-title');
  document.body.append(dlg);

  const apply = (next, focusSel) => {
    layout = settle(next);
    setLayout(layout);
    onChange();
    draw(focusSel);
  };

  function draw(focusSel) {
    const presetCards = Object.entries(PRESETS)
      .map(
        ([id, p]) => `
        <label class="cz-preset">
          <input type="radio" name="cz-preset" value="${id}" ${layout.preset === id ? 'checked' : ''}>
          ${sketch(fromPreset(id))}
          <span class="cz-preset-name">${esc(p.name)}</span>
          <span class="cz-preset-desc">${esc(p.desc)}</span>
        </label>`,
      )
      .join('');
    const rows = layout.order
      .map((id, i) => {
        const b = BLOCKS.find((x) => x.id === id);
        const on = isShown(layout, id);
        return `
        <li class="cz-row${on ? '' : ' is-off'}" data-id="${id}">
          <div class="cz-text"><span class="cz-name">${esc(b.name)}</span><span class="cz-desc">${esc(b.desc)}</span></div>
          <div class="cz-tools">
            <button type="button" class="icon-btn" data-move="-1" aria-label="Move ${esc(b.name)} up" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
            <button type="button" class="icon-btn" data-move="1" aria-label="Move ${esc(b.name)} down" ${i === layout.order.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
            <button type="button" class="switch" role="switch" aria-checked="${on}" data-toggle="${id}" aria-label="Show ${esc(b.name)}">
              <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
            </button>
          </div>
        </li>`;
      })
      .join('');
    const progOn = isShown(layout, 'progress');
    dlg.innerHTML = `
      <div class="sheet-body">
        <div class="sheet-top">
          <h2 class="sheet-title" id="cz-title">Customize Home</h2>
          <button type="button" class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button>
        </div>
        <p class="muted small">Pick a starting point, then move or hide blocks. Changes show right away.</p>
        <fieldset class="cz-presets">
          <legend class="sr-only">Presets</legend>
          ${presetCards}
        </fieldset>
        ${layout.preset === 'custom' ? '<p class="cz-custom">Your own layout</p>' : ''}
        <ol class="cz-list" aria-label="Blocks, in order">${rows}</ol>
        <div class="cz-row cz-row-flat${progOn ? '' : ' is-off'}">
          <div class="cz-text"><span class="cz-name">Semester progress</span><span class="cz-desc">The strip of assessments under the date</span></div>
          <button type="button" class="switch" role="switch" aria-checked="${progOn}" data-toggle="progress" aria-label="Show semester progress">
            <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          </button>
        </div>
        <p class="muted small">On a wide screen Home spreads into columns, following the same order.</p>
        <div class="sheet-actions sheet-actions-split">
          <button type="button" class="btn btn-ghost" data-act="reset">${icon('reset')}Reset to default</button>
          <button type="button" class="btn btn-primary" data-act="close">Done</button>
        </div>
      </div>`;
    if (focusSel) dlg.querySelector(focusSel)?.focus();
  }

  dlg.addEventListener('change', (e) => {
    if (e.target.name === 'cz-preset') apply(fromPreset(e.target.value), `input[value="${e.target.value}"]`);
  });
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'close') return dlg.close();
    if (b.dataset.act === 'reset') return apply(fromPreset('dates'), '[data-act="reset"]');
    if (b.dataset.toggle) {
      const id = b.dataset.toggle;
      const hidden = layout.hidden.includes(id) ? layout.hidden.filter((x) => x !== id) : [...layout.hidden, id];
      return apply({ ...layout, hidden }, `[data-toggle="${id}"]`);
    }
    if (b.dataset.move) {
      const id = b.closest('[data-id]').dataset.id;
      const order = [...layout.order];
      const i = order.indexOf(id);
      const j = i + Number(b.dataset.move);
      if (j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      // keep focus on the same control of the moved block (or its other arrow at the ends)
      const sel = `[data-id="${id}"] [data-move="${b.dataset.move}"]`;
      apply({ ...layout, order }, sel);
      const f = dlg.querySelector(sel);
      if (f?.disabled) dlg.querySelector(`[data-id="${id}"] [data-move="${-Number(b.dataset.move)}"]`)?.focus();
    }
  });
  dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 0));
  draw();
  openDialog(dlg);
}
