import { getState, getGrades, startWith, loadDemo, catalog } from '../store.js';
import { NEWS } from '../catalog.js';
import { progressHtml, doneButton, examButton, isFinished, doneOn } from '../progress.js';
import { getLayout, isShown, openCustomize } from '../layout.js';
import { maybeStartTour } from '../tour.js';
import { unseenNews, markNewsSeen } from '../store.js';
import { evaluate, datedItems, weightedMean } from '../grades.js';
import { esc, fmt, pct, scale, icon, fmtDate, relDay, daysFrom, statusPill, countTo, go, today, safeUrl, reveal } from '../ui.js';
import { mountInstallHint } from '../install.js';

/** Dated items from `from` to `horizon` days ahead, soonest first. */
export function upcoming(subjects, limit = Infinity, horizon = Infinity, from = 0) {
  const rows = [];
  for (const s of subjects) {
    for (const n of datedItems(s)) {
      const d = daysFrom(n.date);
      if (d >= from && d <= horizon && !isFinished(s, n.item)) rows.push({ s, n, d });
    }
  }
  return rows.sort((a, b) => a.d - b.d || a.s.code.localeCompare(b.s.code)).slice(0, limit);
}

export function deadlineRow({ s, n }) {
  const where = [n.item.time, n.item.place].filter(Boolean).map(esc).join(', ');
  return `
    <li class="deadline${isFinished(s, n.item) ? ' is-done' : ''}" data-color="${esc(s.color)}" data-done-row>
      <time class="deadline-date" datetime="${n.date}">
        <span>${fmtDate(n.date, { day: 'numeric' })}</span>
        <small>${fmtDate(n.date, { month: 'short' })}</small>
      </time>
      <div class="deadline-text">
        <a href="#/s/${esc(s.id)}" class="deadline-title"><span class="code-dot" aria-hidden="true"></span>${esc(s.code)}: ${esc(n.item.name)}</a>
        <span class="muted">${relDay(n.date)}, ${n.isMilestone ? 'no grade' : `${pct(n.frac)} of the final mark`}${
          doneOn(s.id, n.item.id) ? `. ${n.item.kind === 'exam' || n.item.kind === 'test' ? 'Taken' : 'Submitted'} on ${fmtDate(doneOn(s.id, n.item.id), { day: 'numeric', month: 'short' })}` : ''
        }</span>
        ${where ? `<span class="deadline-where">${where}</span>` : ''}
        <span class="row-actions">${doneButton(s, n.item)}${examButton(s, n.item)}${campusLink(s, n.item)}</span>
      </div>
    </li>`;
}

/** Link to the task (or the course page) on the university's campus, when there is one. */
export function campusLink(s, item) {
  const url = safeUrl(item?.url) || safeUrl(s.url);
  if (!url) return '';
  return `<a class="link-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${item?.url ? 'Open the task' : 'Open the course page'}${icon('external')}</a>`;
}

/** A deadline with a ring that fills as the day gets closer (two weeks out = empty). */
function counter(r, big) {
  const p = Math.max(0.03, 1 - Math.min(r.d, 14) / 14);
  const when = [fmtDate(r.n.date), r.n.item.time, r.n.item.place].filter(Boolean).map(esc).join(', ');
  const label = r.d === 0 ? 'Today' : `${r.d} ${r.d === 1 ? 'day' : 'days'} left`;
  return `
    <li class="count${big ? ' count-lg' : ''}" data-color="${esc(r.s.color)}" data-done-row>
      <div class="count-ring" role="img" aria-label="${label}">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle class="ring-track" cx="32" cy="32" r="28"/>
          <circle class="ring-fill" cx="32" cy="32" r="28" pathLength="1" stroke-dasharray="${p.toFixed(3)} 1"/>
        </svg>
        ${r.d === 0 ? '<span class="count-n count-today">Today</span>' : `<span class="count-n num">${r.d}</span><span class="count-u">${r.d === 1 ? 'day' : 'days'}</span>`}
      </div>
      <div class="count-text">
        <a class="count-title" href="#/s/${esc(r.s.id)}"><span class="code-dot" aria-hidden="true"></span>${esc(r.s.code)}: ${esc(r.n.item.name)}</a>
        <span class="count-when">${when}</span>
        <span class="muted">${r.n.isMilestone ? 'No grade' : `${pct(r.n.frac)} of the final mark`}</span>
        <span class="row-actions">${doneButton(r.s, r.n.item)}${examButton(r.s, r.n.item)}${campusLink(r.s, r.n.item)}</span>
      </div>
    </li>`;
}

function newsRow(item, s, isNew) {
  return `
    <li class="deadline${isNew ? ' is-new' : ''}" data-color="${esc(s.color)}">
      <time class="deadline-date" datetime="${item.date}">
        <span>${fmtDate(item.date, { day: 'numeric' })}</span>
        <small>${fmtDate(item.date, { month: 'short' })}</small>
      </time>
      <div class="deadline-text">
        <a href="#/s/${esc(s.id)}" class="deadline-title"><span class="code-dot" aria-hidden="true"></span>${esc(s.code)}: ${esc(item.title)}${isNew ? '<span class="tag tag-new">New</span>' : ''}</a>
        <span class="muted">${esc(item.detail)}</span>
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
        <button class="btn btn-ghost btn-lg" type="button" id="pick-demo">See an example</button>
      </div>
      <p class="muted small pick-note">The example fills in made-up grades so you can look around. You can add optional subjects later in Settings.</p>
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
    go(ids.length ? '#/' : '#/settings');
  });
  root.querySelector('#pick-demo').addEventListener('click', () => {
    loadDemo();
    go('#/');
  });
}

// On wide screens the home splits into three columns: subjects, calendar, and what's next.
// The blocks are moved (not just restyled) so reading and tab order match what you see.
const WIDE = matchMedia('(min-width: 1400px)');
function arrange(root) {
  const home = root.querySelector('#home');
  if (!home) return;
  const $ = (sel) => home.querySelector(sel);
  const layout = getLayout();
  const head = $('.dash-head');
  const blocks = { calendar: $('#cal'), next: $('.dash-side'), subjects: $('.subjects-block'), news: $('#news') };
  const install = $('[data-install-slot]');
  const shown = layout.order.filter((id) => isShown(layout, id) && blocks[id]);
  if (!isShown(layout, 'progress')) head.querySelector('#progress')?.remove();
  if (!shown.includes('news')) head.querySelector('#news-flag')?.remove();
  const wide = WIDE.matches && shown.includes('calendar');
  home.className = 'home';
  home.replaceChildren();
  const col = (cls, kids) => {
    const d = document.createElement('div');
    d.className = cls;
    d.append(...kids);
    return d;
  };
  if (wide && shown.includes('subjects') && shown.indexOf('subjects') < shown.indexOf('calendar')) {
    // grades first: subject cards in the middle, calendar and the rest on the right
    const right = shown.filter((id) => id !== 'subjects').map((id) => blocks[id]);
    right.push(install);
    home.classList.add('home-wide', 'no-left', 'subjects-center');
    home.append(col('home-center', [head, blocks.subjects]), col('home-right', right));
    return;
  }
  if (wide) {
    // subjects on the left, calendar in the middle, everything else on the right, in the chosen order
    const left = shown.includes('subjects') ? [blocks.subjects] : [];
    const right = shown.filter((id) => id !== 'calendar' && id !== 'subjects').map((id) => blocks[id]);
    const center = [head, blocks.calendar];
    if (right.length) right.push(install);
    else center.push(install);
    home.classList.add('home-wide');
    if (!left.length) home.classList.add('no-left');
    if (!right.length) home.classList.add('no-right');
    if (left.length) home.append(col('home-left', left));
    home.append(col('home-center', center));
    if (right.length) home.append(col('home-right', right));
    return;
  }
  // stacked in the chosen order; calendar and next up side by side when they follow each other
  home.append(head);
  for (let k = 0; k < shown.length; k++) {
    const id = shown[k];
    const pair = (id === 'calendar' && shown[k + 1] === 'next') || (id === 'next' && shown[k + 1] === 'calendar');
    if (pair) {
      home.append(col('dash', [blocks[id], blocks[shown[k + 1]]]));
      k++;
    } else home.append(blocks[id]);
  }
  home.append(install);
}

WIDE.addEventListener('change', () => {
  const root = document.getElementById('main');
  if (root?.querySelector('#home')) arrange(root);
});

export function renderHome(root) {
  const st = getState();
  if (!st.onboarded) return onboarding(root);

  const evs = st.subjects.map((s) => ({ s, ev: evaluate(s, getGrades(s.id)) }));
  const avg = weightedMean(evs.map(({ s, ev }) => ({ value: ev.average, ects: s.ects })));
  const totalEcts = evs.reduce((a, { s }) => a + (Number(s.ects) || 0), 0);
  const gradedShare = totalEcts ? evs.reduce((a, { s, ev }) => a + ev.gradedFrac * (Number(s.ects) || 0), 0) / totalEcts : 0;
  const byId = Object.fromEntries(st.subjects.map((s) => [s.id, s]));
  const fresh = new Set(unseenNews().map((n) => n.id));
  // unseen news always shows; then the latest ones, up to four
  const news = NEWS.filter((n) => byId[n.subject]).sort((a, b) => fresh.has(b.id) - fresh.has(a.id)).slice(0, Math.max(4, fresh.size));

  // Dates first: countdowns to the next deadlines and a calendar (week or month).
  const all = upcoming(st.subjects);
  const inWeek = all.filter((r) => r.d <= 7).length;
  const now = today();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayKey = iso(now);
  const byDate = new Map();
  for (const sub of st.subjects) {
    for (const n of datedItems(sub)) {
      if (!byDate.has(n.date)) byDate.set(n.date, []);
      byDate.get(n.date).push({ s: sub, n });
    }
  }

  root.innerHTML = `
    <div class="home" id="home">
    <header class="dash-head">
      <div class="dash-title">
        <h1 class="display">${new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}</h1>
        <button type="button" class="btn btn-ghost btn-sm" id="customize" aria-label="Customize Home">${icon('sliders')}<span class="cz-label">Customize</span></button>
      </div>
      <p class="lede">${
        !st.subjects.length
          ? 'Add a subject to see its deadlines here.'
          : inWeek
            ? `${inWeek} ${inWeek === 1 ? 'deadline' : 'deadlines'} in the next 7 days.`
            : 'Nothing due in the next 7 days.'
      }</p>
      ${progressHtml(st)}
      ${
        fresh.size
          ? `<button type="button" class="news-flag" id="news-flag"><span class="news-dot" aria-hidden="true"></span>${fresh.size} ${fresh.size === 1 ? 'update' : 'updates'} to your subjects since your last visit</button>`
          : ''
      }
    </header>

    ${
      st.subjects.length
        ? `<div class="dash">
            <section class="card cal" aria-label="Calendar" id="cal"></section>
            <section class="dash-side" aria-labelledby="h-next">
              <div class="block-head dash-sub">
                <h2 class="section-title" id="h-next">Next up</h2>
                <a class="link" href="#/overview">All deadlines</a>
              </div>
              ${
                all.length
                  ? `<ul class="counts">${all.slice(0, 4).map((r, k) => counter(r, k === 0)).join('')}</ul>`
                  : '<p class="muted">No upcoming dates. Add them with Edit structure on each subject.</p>'
              }
            </section>
          </div>`
        : ''
    }

    <div class="subjects-block">
    <div class="block-head subjects-head">
      <h2 class="section-title" id="h-subjects">Your subjects</h2>
      <p class="muted">${
        avg == null
          ? 'Add your first grade to see your average.'
          : `Average <strong class="num" id="home-avg">${fmt(avg)}</strong>, ${pct(gradedShare)} of the semester graded`
      }</p>
    </div>

    <section class="tiles" aria-labelledby="h-subjects">
      ${evs
        .map(
          ({ s, ev }, i) => `
        <a class="tile" href="#/s/${esc(s.id)}" data-color="${esc(s.color)}" data-reveal style="--i:${i}">
          <span class="tile-top">
            <span class="tile-code"><span class="code-dot" aria-hidden="true"></span>${esc(s.code)}</span>
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
    </div>

    ${
      news.length
        ? `<section class="block" aria-labelledby="h-news" id="news">
            <div class="block-head"><h2 class="section-title" id="h-news">Course news</h2></div>
            <ul class="deadlines">${news.map((n) => newsRow(n, byId[n.subject], fresh.has(n.id))).join('')}</ul>
          </section>`
        : ''
    }

    <div data-install-slot></div>
    </div>`;

  arrange(root);
  countTo(root.querySelector('#home-avg'), avg);
  root.querySelector('#customize')?.addEventListener('click', () =>
    openCustomize(() => {
      renderHome(root);
      reveal(root);
    }),
  );
  root.querySelector('#news-flag')?.addEventListener('click', () => {
    const n = root.querySelector('#news');
    n?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    n?.querySelector('a')?.focus({ preventScroll: true });
  });
  if (root.querySelector('#news')) markNewsSeen();
  maybeStartTour();

  // ----- calendar: week or month, with previous / next / today
  const cal = root.querySelector('#cal');
  if (cal) {
    const monday = (d) => {
      const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
      return m;
    };
    const add = (d, days) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
    const long = (d, o) => new Intl.DateTimeFormat('en-GB', o).format(d);
    let view = 'month';
    try {
      if (localStorage.getItem('mai-grades:cal') === 'week') view = 'week';
    } catch {
      /* ignore */
    }
    let cursor = new Date(now);
    let selected = (all.find((r) => r.n.date.slice(0, 7) === todayKey.slice(0, 7)) || {}).n?.date || todayKey;

    const dayItems = (key) => {
      const items = byDate.get(key) || [];
      return items.length ? `<ul class="deadlines">${items.map(deadlineRow).join('')}</ul>` : '';
    };

    const draw = () => {
      let title;
      let body;
      if (view === 'month') {
        const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const start = monday(first);
        const weeks = Math.ceil(((first.getDay() + 6) % 7 + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7);
        title = long(first, { month: 'long', year: 'numeric' });
        const cells = Array.from({ length: weeks * 7 }, (_, k) => {
          const d = add(start, k);
          const key = iso(d);
          const items = byDate.get(key) || [];
          const cls = `cal-day${key === todayKey ? ' is-today' : ''}${key < todayKey ? ' is-past' : ''}${d.getMonth() !== first.getMonth() ? ' is-out' : ''}`;
          const num = `<span class="cal-n">${d.getDate()}</span>`;
          if (!items.length) return `<span class="${cls}">${num}</span>`;
          const chips = [...new Map(items.map((r) => [r.s.id, r])).values()]
            .slice(0, 3)
            .map((r) => `<span class="cal-chip${isFinished(r.s, r.n.item) ? ' is-done' : ''}" data-color="${esc(r.s.color)}"><i></i><b>${esc(r.s.code)}<span class="chip-name">: ${esc(r.n.item.name)}</span></b></span>`)
            .join('');
          const label = `${fmtDate(key)}: ${items.map((r) => `${r.s.code} ${r.n.item.name}`).join('; ')}`;
          return `<button type="button" class="${cls}" data-day="${key}" aria-pressed="${key === selected}" aria-label="${esc(label)}">${num}<span class="cal-chips">${chips}</span></button>`;
        }).join('');
        body = `
          <div class="cal-grid">
            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span class="cal-dow" aria-hidden="true">${d}</span>`).join('')}
            ${cells}
          </div>
          <div class="cal-panel" aria-live="polite">
            ${dayItems(selected) || '<p class="muted small">Pick a marked day to see what is due.</p>'}
          </div>`;
      } else {
        const start = monday(cursor);
        const end = add(start, 6);
        title = `${long(start, { day: 'numeric', ...(start.getMonth() !== end.getMonth() ? { month: 'short' } : {}) })} to ${long(end, { day: 'numeric', month: 'long' })}`;
        body = `<ol class="cal-week">${Array.from({ length: 7 }, (_, k) => {
          const d = add(start, k);
          const key = iso(d);
          const items = byDate.get(key) || [];
          return `<li class="wk${key === todayKey ? ' is-today' : ''}${key < todayKey ? ' is-past' : ''}">
            <span class="wk-day"><small>${long(d, { weekday: 'short' })}</small><span class="cal-n">${d.getDate()}</span></span>
            <div class="wk-items">${
              items.length
                ? items
                    .map(
                      (r) => `<div class="wk-item${isFinished(r.s, r.n.item) ? ' is-done' : ''}" data-color="${esc(r.s.color)}" data-done-row>
                        <a href="#/s/${esc(r.s.id)}" class="wk-title">${esc(r.s.code)}: ${esc(r.n.item.name)}</a>
                        <span class="muted">${[r.n.item.time, r.n.item.place, r.n.isMilestone ? 'no grade' : `${pct(r.n.frac)} of the final mark`].filter(Boolean).map(esc).join(', ')}</span>
                        <span class="row-actions">${doneButton(r.s, r.n.item)}${examButton(r.s, r.n.item)}${campusLink(r.s, r.n.item)}</span>
                      </div>`,
                    )
                    .join('')
                : '<span class="wk-none" aria-label="Nothing due"></span>'
            }</div>
          </li>`;
        }).join('')}</ol>`;
      }
      cal.innerHTML = `
        <div class="cal-head">
          <h2 class="cal-title" aria-live="polite">${title}</h2>
          <div class="cal-nav">
            <button type="button" class="icon-btn" data-cal="prev" aria-label="Previous ${view}">${icon('back')}</button>
            <button type="button" class="btn btn-ghost btn-sm" data-cal="today">Today</button>
            <button type="button" class="icon-btn cal-next" data-cal="next" aria-label="Next ${view}">${icon('back')}</button>
          </div>
          <div class="segmented" role="group" aria-label="Calendar view">
            <button type="button" data-view="week" aria-pressed="${view === 'week'}">Week</button>
            <button type="button" data-view="month" aria-pressed="${view === 'month'}">Month</button>
          </div>
        </div>
        ${body}`;
    };

    cal.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const keep = b.dataset.cal || (b.dataset.view ? `view-${b.dataset.view}` : null);
      if (b.dataset.day) selected = b.dataset.day;
      else if (b.dataset.view) {
        view = b.dataset.view;
        try {
          localStorage.setItem('mai-grades:cal', view);
        } catch {
          /* ignore */
        }
      } else if (b.dataset.cal === 'today') cursor = new Date(now);
      else if (b.dataset.cal) {
        const dir = b.dataset.cal === 'next' ? 1 : -1;
        cursor = view === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1) : add(cursor, 7 * dir);
      } else return;
      draw();
      // keep keyboard focus on the control that was used
      const again = b.dataset.day
        ? cal.querySelector(`[data-day="${b.dataset.day}"]`)
        : keep?.startsWith('view-')
          ? cal.querySelector(`[data-view="${keep.slice(5)}"]`)
          : cal.querySelector(`[data-cal="${keep}"]`);
      again?.focus({ preventScroll: true });
    });
    draw();
  }
  mountInstallHint(root.querySelector('[data-install-slot]'));
}
