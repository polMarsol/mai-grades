import { getState, getGrades, getTarget, startWith, catalog } from '../store.js';
import { evaluate, datedItems, weightedMean } from '../grades.js';
import { esc, fmt, pct, scale, icon, fmtDate, relDay, daysFrom, statusPill, countTo } from '../ui.js';

export function upcoming(subjects, limit = Infinity, horizon = Infinity) {
  const rows = [];
  for (const s of subjects) {
    for (const n of datedItems(s)) {
      const d = daysFrom(n.date);
      if (d >= 0 && d <= horizon) rows.push({ s, n, d });
    }
  }
  return rows.sort((a, b) => a.d - b.d || a.s.code.localeCompare(b.s.code)).slice(0, limit);
}

export function deadlineRow({ s, n }) {
  return `
    <li class="deadline" data-color="${esc(s.color)}">
      <time class="deadline-date" datetime="${n.date}">
        <span>${fmtDate(n.date, { day: 'numeric' })}</span>
        <small>${fmtDate(n.date, { month: 'short' })}</small>
      </time>
      <div class="deadline-text">
        <a href="#/s/${esc(s.id)}" class="deadline-title"><span class="code-dot" aria-hidden="true"></span>${esc(s.code)}: ${esc(n.item.name)}</a>
        <span class="muted">${relDay(n.date)}, ${n.isMilestone ? 'no grade' : `${pct(n.frac)} of the final mark`}</span>
      </div>
    </li>`;
}

function onboarding(root) {
  root.innerHTML = `
    <section class="intro">
      <h1 class="display">Track your MAI grades</h1>
      <p class="lede">Pick your subjects. Enter each grade as you get it and see your final mark, what you need on the rest, and every deadline. Your grades stay on this device.</p>
    </section>
    <form class="pick" id="pick">
      <fieldset>
        <legend class="section-title">First semester, 2026–27</legend>
        <div class="pick-grid">
          ${catalog
            .map(
              (s, i) => `
            <label class="pick-card" data-color="${s.color}" data-reveal style="--i:${i}">
              <input type="checkbox" name="s" value="${s.id}" checked>
              <span class="pick-check" aria-hidden="true">${icon('check')}</span>
              <span class="pick-code">${esc(s.code)}</span>
              <span class="pick-name">${esc(s.name)}</span>
              <span class="pick-meta muted">${esc(s.university)}, ${s.ects} ECTS</span>
            </label>`,
            )
            .join('')}
        </div>
      </fieldset>
      <div class="pick-actions">
        <button class="btn btn-primary btn-lg" type="submit" id="pick-go">Start tracking</button>
        <p class="muted small">You can add optional subjects or build your own later in Settings.</p>
      </div>
    </form>`;

  const form = root.querySelector('#pick');
  const btn = root.querySelector('#pick-go');
  const sync = () => {
    const n = form.querySelectorAll('input:checked').length;
    btn.textContent = n ? `Start tracking ${n} subject${n === 1 ? '' : 's'}` : 'Start with no subjects';
  };
  form.addEventListener('change', sync);
  sync();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ids = [...form.querySelectorAll('input:checked')].map((i) => i.value);
    startWith(ids);
    location.hash = ids.length ? '#/' : '#/settings';
  });
}

export function renderHome(root) {
  const st = getState();
  if (!st.onboarded) return onboarding(root);

  const evs = st.subjects.map((s) => ({ s, ev: evaluate(s, getGrades(s.id)) }));
  const avg = weightedMean(evs.map(({ s, ev }) => ({ value: ev.average, ects: s.ects })));
  const totalEcts = evs.reduce((a, { s }) => a + (Number(s.ects) || 0), 0);
  const gradedShare = totalEcts ? evs.reduce((a, { s, ev }) => a + ev.gradedFrac * (Number(s.ects) || 0), 0) / totalEcts : 0;
  const next = upcoming(st.subjects, 4, 45);

  root.innerHTML = `
    <section class="home-head">
      <div>
        <h1 class="display">Your subjects</h1>
        <p class="lede">${
          avg == null
            ? 'Add your first grade to see your average.'
            : `Average <strong class="num" id="home-avg">${fmt(avg)}</strong> across ${pct(gradedShare)} of the semester graded so far.`
        }</p>
      </div>
    </section>

    <section class="tiles" aria-label="Subjects">
      ${evs
        .map(
          ({ s, ev }, i) => `
        <a class="tile" href="#/s/${esc(s.id)}" data-color="${esc(s.color)}" data-spotlight data-reveal style="--i:${i}">
          <span class="tile-top">
            <span class="tile-code">${esc(s.code)}</span>
            ${ev.status === 'not-started' ? '' : statusPill(ev.status)}
          </span>
          <span class="tile-name">${esc(s.name)}</span>
          <span class="tile-grade">
            <span class="tile-num num${ev.average == null ? ' is-empty' : ''}">${ev.average == null ? '–' : fmt(ev.average)}</span>
            <span class="tile-num-label muted">${ev.average == null ? 'No grades yet' : 'Current average'}</span>
          </span>
          ${scale(ev, { label: s.code })}
          <span class="tile-foot muted">
            <span>${pct(ev.gradedFrac)} graded</span>
            ${(() => {
              const n = upcoming([s], 1)[0];
              return n ? `<span>Next: ${esc(n.n.item.name)}, ${relDay(n.n.date)}</span>` : '';
            })()}
          </span>
          <span class="tile-go" aria-hidden="true">${icon('arrow')}</span>
        </a>`,
        )
        .join('')}
      <a class="tile tile-add" href="#/settings?add=1" data-reveal style="--i:${evs.length}">
        <span class="tile-add-icon">${icon('plus')}</span>
        <span>Add a subject</span>
      </a>
    </section>

    ${
      next.length
        ? `<section class="block" aria-labelledby="h-next">
            <div class="block-head">
              <h2 class="section-title" id="h-next">Coming up</h2>
              <a class="link" href="#/overview">All deadlines</a>
            </div>
            <ul class="deadlines">${next.map(deadlineRow).join('')}</ul>
          </section>`
        : ''
    }`;

  countTo(root.querySelector('#home-avg'), avg);
}
