import { getState, getSubject, addFromCatalog, createCustom, moveSubject, exportData, importData, eraseAll, catalog } from '../store.js';
import { esc, icon, toast, download, confirmDialog, openDialog } from '../ui.js';
import { openEditor } from '../editor.js';
import { buildICS } from '../ics.js';
import { getTheme, setTheme } from '../theme.js';

function openAdd(onDone) {
  const st = getState();
  const available = catalog.filter((c) => !st.subjects.some((s) => s.id === c.id));
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet sheet-sm';
  dlg.setAttribute('aria-labelledby', 'add-title');
  dlg.innerHTML = `
    <div class="sheet-body">
      <div class="sheet-top">
        <h2 class="sheet-title" id="add-title">Add a subject</h2>
        <button type="button" class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button>
      </div>
      ${
        available.length
          ? `<p class="muted small">From the 2026–27 course guides</p>
             <ul class="add-list">
               ${available
                 .map(
                   (c) => `<li><button type="button" class="add-row" data-add="${c.id}" data-color="${c.color}">
                     <span class="code-dot" aria-hidden="true"></span><strong>${esc(c.code)}</strong><span class="muted">${esc(c.name)}</span>${icon('plus')}
                   </button></li>`,
                 )
                 .join('')}
             </ul>`
          : ''
      }
      <button type="button" class="btn btn-primary btn-block" data-act="custom">${icon('edit')}Create your own subject</button>
      <p class="muted small">For optional subjects or anything not listed: set the items and weights from your course guide.</p>
    </div>`;
  document.body.append(dlg);
  openDialog(dlg);
  dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 0));
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'close') dlg.close();
    if (b.dataset.add) {
      addFromCatalog(b.dataset.add);
      toast(`${catalog.find((c) => c.id === b.dataset.add).code} added`);
      dlg.close();
      onDone();
    }
    if (b.dataset.act === 'custom') {
      const s = createCustom();
      dlg.close();
      onDone();
      openEditor(s, onDone);
    }
  });
}

export function renderSettings(root, params) {
  const st = getState();
  const theme = getTheme();
  root.innerHTML = `
    <h1 class="display">Settings</h1>

    <section class="block" aria-labelledby="h-app">
      <h2 class="section-title" id="h-app">Appearance</h2>
      <div class="card list">
        <div class="list-row">
          <span>Theme</span>
          <div class="segmented" role="group" aria-label="Theme">
            ${[
              ['system', 'Automatic', 'auto'],
              ['light', 'Light', 'sun'],
              ['dark', 'Dark', 'moon'],
            ]
              .map(([v, l, ic]) => `<button type="button" data-theme-set="${v}" aria-pressed="${theme === v}">${icon(ic)}${l}</button>`)
              .join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="block" aria-labelledby="h-subj">
      <div class="block-head">
        <h2 class="section-title" id="h-subj">Subjects</h2>
        <button type="button" class="btn btn-ghost btn-sm" id="add">${icon('plus')}Add a subject</button>
      </div>
      <div class="card list">
        ${
          st.subjects.length
            ? st.subjects
                .map(
                  (s, i) => `
          <div class="list-row" data-color="${esc(s.color)}">
            <a class="list-main" href="#/s/${esc(s.id)}"><span class="code-dot" aria-hidden="true"></span><strong>${esc(s.code)}</strong><span class="muted truncate">${esc(s.name)}</span></a>
            <div class="row-tools">
              <button type="button" class="icon-btn" data-move="${esc(s.id)}" data-dir="-1" aria-label="Move ${esc(s.code)} up" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
              <button type="button" class="icon-btn" data-move="${esc(s.id)}" data-dir="1" aria-label="Move ${esc(s.code)} down" ${i === st.subjects.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
              <button type="button" class="icon-btn" data-edit="${esc(s.id)}" aria-label="Edit ${esc(s.code)}">${icon('edit')}</button>
            </div>
          </div>`,
                )
                .join('')
            : '<p class="list-row muted">No subjects yet.</p>'
        }
      </div>
    </section>

    <section class="block" aria-labelledby="h-data">
      <h2 class="section-title" id="h-data">Your data</h2>
      <div class="card list">
        <div class="list-row">
          <div class="list-text"><span>Back up your grades</span><span class="muted small">Download a file you can import on another device.</span></div>
          <button type="button" class="btn btn-ghost btn-sm" id="export">${icon('download')}Export</button>
        </div>
        <div class="list-row">
          <div class="list-text"><span>Restore a backup</span><span class="muted small">Replaces everything on this device.</span></div>
          <label class="btn btn-ghost btn-sm">${icon('upload')}Import<input type="file" accept="application/json,.json" id="import" class="sr-only"></label>
        </div>
        <div class="list-row">
          <div class="list-text"><span>Deadlines in your calendar</span><span class="muted small">An .ics file for Google Calendar, Apple Calendar or Outlook.</span></div>
          <button type="button" class="btn btn-ghost btn-sm" id="ics">${icon('calendar')}Download</button>
        </div>
        <div class="list-row">
          <div class="list-text"><span>Erase everything</span><span class="muted small">Deletes all subjects and grades from this device.</span></div>
          <button type="button" class="btn btn-ghost btn-sm btn-danger-text" id="erase">${icon('trash')}Erase</button>
        </div>
      </div>
    </section>

    <section class="block" aria-labelledby="h-about">
      <h2 class="section-title" id="h-about">About</h2>
      <div class="card list">
        <a class="list-row" href="#/about">
          <div class="list-text"><span>What MAI Grades is for</span><span class="muted small">How it works, and how to report a change or contribute.</span></div>
          ${icon('arrow')}
        </a>
      </div>
      <p class="muted small" style="margin-top:12px">${icon('lock')} Your grades are stored only in this browser. There is no account and nothing is sent anywhere.</p>
    </section>`;

  const rerender = () => renderSettings(root, {});

  root.querySelectorAll('[data-theme-set]').forEach((b) =>
    b.addEventListener('click', () => {
      setTheme(b.dataset.themeSet);
      root.querySelectorAll('[data-theme-set]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }),
  );
  root.querySelector('#add').addEventListener('click', () => openAdd(rerender));
  root.querySelectorAll('[data-move]').forEach((b) =>
    b.addEventListener('click', () => {
      moveSubject(b.dataset.move, Number(b.dataset.dir));
      rerender();
      root.querySelector(`[data-move="${CSS.escape(b.dataset.move)}"][data-dir="${b.dataset.dir}"]:not([disabled])`)?.focus();
    }),
  );
  root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openEditor(getSubject(b.dataset.edit), rerender)));

  root.querySelector('#export').addEventListener('click', () => {
    const d = new Date().toISOString().slice(0, 10);
    download(`mai-grades-${d}.json`, exportData(), 'application/json');
    toast('Backup downloaded');
  });
  root.querySelector('#import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = await confirmDialog({
      title: 'Restore this backup?',
      body: 'Everything currently on this device is replaced by the backup.',
      confirm: 'Restore',
    });
    if (!ok) return (e.target.value = '');
    try {
      importData(await file.text());
      toast('Backup restored', 'good');
      rerender();
    } catch (err) {
      toast(err.message || "This file can't be read as a backup.", 'bad');
    }
    e.target.value = '';
  });
  root.querySelector('#ics').addEventListener('click', () => {
    download('mai-deadlines.ics', buildICS(getState().subjects), 'text/calendar');
    toast('Calendar file downloaded');
  });
  root.querySelector('#erase').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Erase all data?',
      body: 'All subjects and grades are deleted from this device. Export a backup first if you want to keep them.',
      confirm: 'Erase everything',
      danger: true,
    });
    if (ok) {
      eraseAll();
      toast('All data erased');
      location.hash = '#/';
    }
  });

  if (params.add) openAdd(rerender);
}
