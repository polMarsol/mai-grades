import { getSubject, getGrades, getTarget, setGrade, setRetake, setTarget, resetStructure } from '../store.js';
import { evaluate, needed, parseGrade, leafValue, flatten, findItem, itemPath, PASS } from '../grades.js';
import { catalogById } from '../catalog.js';
import { shareLink, needCard, shareImage } from '../share.js';
import { esc, fmt, pct, pctFine, scale, updateScale, icon, fmtDate, relDay, statusPill, countTo, toast } from '../ui.js';
import { openEditor } from '../editor.js';

const TARGETS = [5, 6, 7, 8, 9, 10];
let sim = { on: false, values: {} };

function leafRow(s, n, grades) {
  const it = n.item;
  const e = grades[it.id];
  const val = e?.v ?? null;
  return `
  <div class="leaf" data-id="${esc(it.id)}">
    <div class="leaf-text">
      <label class="leaf-name" for="in-${esc(it.id)}">${esc(it.name)}${it.kind === 'exam' ? '<span class="tag">Exam</span>' : ''}</label>
      <span class="leaf-meta">
        <span>${pctFine(n.frac)} of final</span>
        ${it.date ? `<span>${fmtDate(it.date)} <span class="muted">(${relDay(it.date)})</span></span>` : ''}
        ${it.min != null && it.min !== '' ? `<span>At least ${it.min}</span>` : ''}
      </span>
    </div>
    <div class="leaf-input">
      <input class="grade-input num" id="in-${esc(it.id)}" type="text" inputmode="decimal" autocomplete="off"
             placeholder="–" value="${val == null ? '' : val}" aria-describedby="err-${esc(it.id)}" aria-label="Grade for ${esc(it.name)}, 0 to 10">
      ${
        it.retake
          ? `<label class="mini-check"><input type="checkbox" data-retake ${e?.retake ? 'checked' : ''} ${val == null ? 'disabled' : ''}> Resubmitted, max ${it.retake}</label>`
          : ''
      }
      <span class="leaf-err" id="err-${esc(it.id)}" role="alert"></span>
      ${
        // group work only: exams and quizzes are individual
        it.kind !== 'exam' && it.kind !== 'test' && catalogById[s.id] && findItem(catalogById[s.id].items, it.id)
          ? `<button class="link-btn" type="button" data-share-grade ${val == null ? 'hidden' : ''}>${icon('share')}Share with your team</button>`
          : ''
      }
    </div>
    <div class="leaf-sim">
      <input type="range" min="0" max="10" step="0.1" aria-label="What-if grade for ${esc(it.name)}">
      <output class="num"></output>
    </div>
  </div>`;
}

function groupBlock(s, n, flat, grades) {
  const it = n.item;
  const kids = flat.filter((k) => k.parent === it.id);
  const bodyId = `g-${it.id}`;
  return `
  <section class="group depth-${n.depth}" data-id="${esc(it.id)}">
    <button class="group-head" type="button" aria-expanded="true" aria-controls="${esc(bodyId)}">
      <span class="group-text">
        <span class="group-name">${esc(it.name)}</span>
        <span class="leaf-meta">
          <span>${pctFine(n.frac)} of final</span>
          ${it.min != null && it.min !== '' ? `<span>At least ${it.min}</span>` : ''}
        </span>
      </span>
      <span class="group-grade num" data-node="${esc(it.id)}">–</span>
      ${icon('chevron', 'chev')}
    </button>
    <div class="group-body" id="${esc(bodyId)}">
      <div class="group-inner">
        ${kids.map((k) => (k.isLeaf ? leafRow(s, k, grades) : groupBlock(s, k, flat, grades))).join('')}
      </div>
    </div>
  </section>`;
}

export function renderSubject(root, id) {
  const s = getSubject(id);
  if (!s) {
    root.innerHTML = `
      <section class="empty">
        <h1 class="display">Subject not found</h1>
        <p class="lede">It may have been removed from this device.</p>
        <a class="btn btn-primary" href="#/">Back to your subjects</a>
      </section>`;
    return;
  }
  if (sim.subject !== id) sim = { on: false, values: {}, subject: id };

  const flat = flatten(s.items);
  const grades = getGrades(id);
  const hasMins = flat.some((n) => n.item.min != null && n.item.min !== '');

  root.innerHTML = `
    <a class="back" href="#/">${icon('back')}Subjects</a>
    <header class="subject-head" data-color="${esc(s.color)}">
      <span class="chip">${esc(s.code)}</span>
      <h1 class="title">${esc(s.name)}</h1>
      <p class="muted">${[s.university, s.ects ? `${s.ects} ECTS` : ''].filter(Boolean).map(esc).join(', ')}${s.rule ? `. ${esc(s.rule)}` : ''}</p>
      ${
        s.checked && !s.edited && !s.custom
          ? `<p class="checked">${icon('check')}Checked against the course guide on ${fmtDate(s.checked, { day: 'numeric', month: 'short', year: 'numeric' })}</p>`
          : s.edited
            ? '<p class="checked">Structure edited by you</p>'
            : ''
      }
    </header>

    ${
      s.outdated
        ? `<div class="sim-banner outdated">
            ${icon('alert')}
            <p>The course guide for ${esc(s.code)} changed after you edited it. Restoring it keeps your grades for items that still exist.</p>
            <button class="btn btn-ghost btn-sm" type="button" id="restore">${icon('reset')}Restore official guide</button>
          </div>`
        : ''
    }

    <section class="card hero" data-color="${esc(s.color)}" aria-live="polite">
      <div class="hero-row">
        <div>
          <p class="hero-label" id="h-label">Projected final</p>
          <p class="hero-num num" id="h-num" data-v="">–</p>
        </div>
        <div id="h-status"></div>
      </div>
      <p class="hero-sub" id="h-sub"></p>
      <div id="h-scale">${scale(evaluate(s, grades), { size: 'lg', target: getTarget(id) })}</div>
      <ul class="legend" aria-hidden="true">
        <li><span class="key key-secured"></span>Secured</li>
        <li><span class="key key-reach"></span>Still in play</li>
        <li><span class="key key-proj"></span>Projected</li>
        <li><span class="key key-target"></span>Target</li>
      </ul>
    </section>

    <section class="card goal" aria-labelledby="h-goal">
      <div class="goal-head">
        <h2 class="section-title" id="h-goal">What you need</h2>
        <div class="segmented" role="group" aria-label="Target grade">
          ${TARGETS.map((t) => `<button type="button" data-target="${t}" aria-pressed="${t === getTarget(id)}">${t}</button>`).join('')}
        </div>
      </div>
      <p class="need" id="need"></p>
      <button class="btn btn-ghost btn-sm" type="button" id="share-need">${icon('share')}Share as an image</button>
      ${hasMins ? '<ul class="reqs" id="reqs" aria-label="Minimum grades"></ul>' : ''}
    </section>

    <section class="block" aria-labelledby="h-items" data-color="${esc(s.color)}">
      <div class="block-head">
        <h2 class="section-title" id="h-items">Assessment</h2>
        <div class="tools">
          <button class="switch" type="button" id="sim-toggle" role="switch" aria-checked="false">
            <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
            What-if mode
          </button>
          <button class="btn btn-ghost btn-sm" type="button" id="edit">${icon('edit')}Edit structure</button>
        </div>
      </div>
      <div class="sim-banner" id="sim-banner" hidden>
        ${icon('flask')}
        <p>Drag the sliders on ungraded items to try out scenarios. Your saved grades don't change.</p>
        <button class="btn btn-ghost btn-sm" type="button" id="sim-reset">${icon('reset')}Reset</button>
      </div>
      <div class="items" id="items">
        ${flat.filter((n) => n.depth === 0).map((n) => (n.isLeaf ? leafRow(s, n, grades) : groupBlock(s, n, flat, grades))).join('')}
      </div>
    </section>

    ${
      s.milestones?.length
        ? `<section class="block" aria-labelledby="h-dates">
            <div class="block-head"><h2 class="section-title" id="h-dates">Other dates</h2></div>
            <ul class="deadlines" data-color="${esc(s.color)}">
              ${[...s.milestones]
                .filter((m) => m.date)
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(
                  (m) => `<li class="deadline">
                    <time class="deadline-date" datetime="${m.date}"><span>${fmtDate(m.date, { day: 'numeric' })}</span><small>${fmtDate(m.date, { month: 'short' })}</small></time>
                    <div class="deadline-text"><span class="deadline-title">${esc(m.name)}</span><span class="muted">${relDay(m.date)}, no grade</span></div>
                  </li>`,
                )
                .join('')}
            </ul>
          </section>`
        : ''
    }

    ${
      s.source || s.notes?.length
        ? `<section class="notes">
            ${s.notes?.length ? `<ul>${s.notes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
            ${s.source ? `<p>Source: ${esc(s.source)}. Check the official guide if anything changes.</p>` : ''}
          </section>`
        : ''
    }`;

  const $ = (sel) => root.querySelector(sel);

  function refresh() {
    const g = getGrades(id);
    const target = getTarget(id);
    const real = evaluate(s, g);
    const ev = sim.on ? evaluate(s, g, sim.values) : real;

    // hero
    let label = 'Projected final';
    let value = ev.projected;
    if (real.complete && !sim.on) {
      label = 'Final mark';
      value = real.secured;
    } else if (sim.on) label = 'What-if final';
    $('#h-label').textContent = label;
    countTo($('#h-num'), value);
    $('#h-status').innerHTML = statusPill(sim.on ? simStatus(ev) : real.status);

    let sub;
    if (sim.on) sub = `Based on your what-if values. You have ${fmt(real.secured)} points secured for real.`;
    else if (real.gradedFrac === 0) sub = 'Enter your first grade below to see a projection.';
    else if (real.complete) sub = 'Every item is graded.';
    else
      sub = `If you keep your current average of ${fmt(real.average)}. ${fmt(real.secured)} of 10 points are secured with ${pct(real.gradedFrac)} graded; up to ${fmt(real.maxReachable)} is still reachable.`;
    $('#h-sub').textContent = sub;
    updateScale($('#h-scale .scale'), ev, target);

    // what you need
    const need = needed(s, g, target);
    const failedReq = real.requirements.find((r) => r.status === 'failed');
    let html;
    if (need.kind === 'secured') html = `Your <strong>${target}</strong> is secured, whatever happens next.`;
    else if (need.kind === 'impossible')
      html = failedReq
        ? `${esc(failedReq.name)} is below its minimum of ${failedReq.min}, so this target can't be reached on continuous assessment.`
        : `A ${target} is out of reach. The most you can still get is <strong class="num">${fmt(need.max)}</strong>.`;
    else {
      html = `Average <strong class="num">${fmt(need.x)}</strong> on the remaining ${pct(real.remainingFrac)} to finish with ${target === 8 ? 'an' : 'a'} ${target}.`;
      if (need.binding) html += ` The minimum on ${esc(need.binding.name)} (${need.binding.min}) is what sets this.`;
    }
    $('#need').innerHTML = html;
    $('#share-need').hidden = need.kind === 'impossible';

    const reqs = $('#reqs');
    if (reqs) {
      const meta = {
        met: ['check', 'good', 'Met'],
        'on-track': ['check', 'neutral', 'On track'],
        'at-risk': ['alert', 'warn', 'Below for now'],
        failed: ['x', 'bad', 'Not met'],
        pending: ['dot', 'neutral', 'Not graded yet'],
      };
      reqs.innerHTML = real.requirements
        .map((r) => {
          const [ic, tone, word] = meta[r.status];
          return `<li class="req req-${tone}">${icon(ic)}<span>${esc(r.name)} at least ${r.min}</span><span class="req-val">${
            r.value == null ? word : `<span class="num">${fmt(r.value)}</span> ${word.toLowerCase()}`
          }</span></li>`;
        })
        .join('');
    }

    // groups
    root.querySelectorAll('[data-node]').forEach((el) => {
      const nd = ev.nodes[el.dataset.node];
      const v = sim.on ? nd?.simValue : nd?.value;
      el.textContent = v == null ? '–' : fmt(v);
    });

    // sim sliders visibility
    root.querySelectorAll('.leaf').forEach((row) => {
      const lid = row.dataset.id;
      const graded = g[lid]?.v != null;
      row.classList.toggle('is-sim', sim.on && !graded);
      row.querySelector('[data-share-grade]')?.toggleAttribute('hidden', !graded);
      if (sim.on && !graded) {
        const r = row.querySelector('input[type=range]');
        const v = sim.values[lid] ?? 5;
        r.value = v;
        row.querySelector('output').textContent = Number(v).toFixed(1);
        r.style.setProperty('--fill', `${v * 10}%`);
      }
    });
  }

  function simStatus(ev) {
    if (ev.projected == null) return 'not-started';
    const anyFail = ev.requirements.some((r) => {
      const nd = ev.nodes[r.id];
      return nd.simValue != null && nd.simValue < r.min;
    });
    if (anyFail || ev.projected < PASS) return 'failed';
    return 'on-track';
  }

  function seedSims() {
    const g = getGrades(id);
    const need = needed(s, g, getTarget(id));
    const real = evaluate(s, g);
    const base = need.kind === 'need' ? need.x : real.average ?? 7;
    sim.values = {};
    for (const n of flat.filter((k) => k.isLeaf)) {
      if (leafValue(n.item, g[n.item.id]) == null) sim.values[n.item.id] = Math.round(Math.min(10, Math.max(0, base)) * 10) / 10;
    }
  }

  // events
  root.querySelectorAll('.grade-input').forEach((inp) => {
    const row = inp.closest('.leaf');
    const lid = row.dataset.id;
    const err = row.querySelector('.leaf-err');
    const retake = row.querySelector('[data-retake]');
    const apply = (commit) => {
      const v = parseGrade(inp.value);
      if (Number.isNaN(v)) {
        inp.setAttribute('aria-invalid', 'true');
        err.textContent = 'Enter a grade from 0 to 10';
        return;
      }
      inp.removeAttribute('aria-invalid');
      err.textContent = '';
      setGrade(id, lid, v, retake?.checked);
      if (retake) retake.disabled = v == null;
      if (v != null) delete sim.values[lid];
      else if (sim.on) sim.values[lid] = 5;
      if (commit && v != null) inp.value = String(v);
      refresh();
    };
    inp.addEventListener('input', () => apply(false));
    inp.addEventListener('change', () => apply(true));
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') inp.blur();
    });
    retake?.addEventListener('change', () => {
      setRetake(id, lid, retake.checked);
      refresh();
    });
    const range = row.querySelector('input[type=range]');
    range.addEventListener('input', () => {
      sim.values[lid] = Number(range.value);
      refresh();
    });
  });

  root.querySelectorAll('.group-head').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
    });
  });

  root.querySelectorAll('[data-target]').forEach((b) => {
    b.addEventListener('click', () => {
      setTarget(id, Number(b.dataset.target));
      root.querySelectorAll('[data-target]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      refresh();
    });
  });

  const toggle = $('#sim-toggle');
  const setSim = (on) => {
    sim.on = on;
    toggle.setAttribute('aria-checked', String(on));
    $('#sim-banner').hidden = !on;
    root.querySelector('.hero').classList.toggle('is-sim', on);
    if (on && !Object.keys(sim.values).length) seedSims();
    refresh();
  };
  toggle.addEventListener('click', () => setSim(!sim.on));
  $('#sim-reset').addEventListener('click', () => {
    seedSims();
    refresh();
    toast('What-if values reset');
  });

  $('#restore')?.addEventListener('click', () => {
    resetStructure(id);
    toast('Official structure restored');
    renderSubject(root, id);
  });

  // Share a group grade as a link the rest of the team can accept.
  root.querySelectorAll('[data-share-grade]').forEach((b) =>
    b.addEventListener('click', () => {
      const lid = b.closest('.leaf').dataset.id;
      const v = getGrades(id)[lid]?.v;
      if (v == null) return;
      const label = itemPath(s.items, lid).slice(-2).join(', ');
      const url = `${location.origin}${location.pathname}#/add?s=${encodeURIComponent(id)}&i=${encodeURIComponent(lid)}&v=${v}`;
      shareLink({ title: `${s.code}: ${label}`, text: `Our grade for ${s.code}, ${label}. Open the link to add it to MAI Grades.`, url });
    }),
  );

  // Share "what I need" as an image. It shows the needed mark, never the grades you have.
  $('#share-need').addEventListener('click', async () => {
    const g = getGrades(id);
    const target = getTarget(id);
    const need = needed(s, g, target);
    if (need.kind === 'impossible') return;
    const open = flat.filter((n) => n.isLeaf && leafValue(n.item, g[n.item.id]) == null);
    const an = target === 8 ? 'an' : 'a';
    const goal = target === PASS ? `pass ${s.code}` : `get ${an} ${target} in ${s.code}`;
    const card =
      need.kind === 'secured'
        ? { lead: 'Secured', big: String(target), tail: `My ${target} in ${s.code} is safe, whatever happens next.`, mark: target }
        : {
            lead: open.length === 1 ? 'I need' : 'I need an average of',
            big: fmt(need.x),
            tail: `${open.length === 1 ? `in the ${open[0].item.name}` : `on the remaining ${pct(evaluate(s, g).remainingFrac)}`} to ${goal}.`,
            mark: need.x,
          };
    const color = getComputedStyle(root.querySelector('.hero')).getPropertyValue('--c').trim() || '#1d1d1f';
    const blob = await needCard({ code: s.code, name: s.name, color, ...card });
    shareImage(blob, `mai-grades-${s.code.toLowerCase()}.png`, `${card.lead} ${card.big} ${card.tail}`);
  });

  $('#edit').addEventListener('click', () =>
    openEditor(s, () => {
      sim = { on: false, values: {}, subject: id };
      renderSubject(root, id);
    }),
  );

  if (sim.on) setSim(true);
  else refresh();
}
