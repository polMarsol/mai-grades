// Stats: the student's grades from every angle. Everything is computed on the device.
import { getState, getGrades, getTarget } from '../store.js';
import { weightedMean } from '../grades.js';
import {
  collect, runningAverage, simulate, sensitivity, workload, streaks,
  mean, sd, quantile, median, geometricMean, harmonicMean, pearson, regression, gpaPoints, hash, PASS,
} from '../stats.js';
import { esc, fmt, pct, pctFine, icon, countTo, fmtDate, parseDate, today, relDay } from '../ui.js';

const DAY = 86400000;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const signed = (x, d = 2) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${Math.abs(x).toFixed(d)}`;
const p10 = (x) => `${(Math.max(0, Math.min(10, x)) * 10).toFixed(2)}%`;

let ro;
let lastWidth = 0;

/** Width available inside a box, without its padding. */
const inner = (el) => {
  const cs = getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
};

export function renderStats(root) {
  const st = getState();
  if (!st.subjects.length) {
    root.innerHTML = `
      <section class="empty">
        <h1 class="display">Stats</h1>
        <p class="lede">Add a subject to see your stats.</p>
        <a class="btn btn-primary" href="#/settings?add=1">${icon('plus')}Add a subject</a>
      </section>`;
    return;
  }

  const rows = collect(st.subjects.map((s) => ({ s, grades: getGrades(s.id), target: getTarget(s.id) })));
  const all = rows.flatMap((r) => r.graded);
  const values = all.map((g) => g.v);
  const totalLeaves = rows.reduce((a, r) => a + r.graded.length + r.open.length, 0);
  const ectsAvg = weightedMean(rows.map((r) => ({ value: r.ev.average, ects: r.ects })));
  const has = values.length > 0;

  root.innerHTML = `
    <h1 class="display">Stats</h1>
    <p class="lede">Your grades from every angle. Worked out on this device; nothing leaves it.</p>

    <section class="card summary" aria-label="Your grades in three numbers">
      <div class="figure">
        <span class="figure-num num" id="st-ects" data-v="">–</span>
        <span class="figure-label">Average weighted by ECTS</span>
      </div>
      <div class="figure">
        <span class="figure-num num" id="st-plain" data-v="">–</span>
        <span class="figure-label">Plain mean of your grades</span>
      </div>
      <div class="figure">
        <span class="figure-num num">${values.length}<span class="figure-of"> of ${totalLeaves}</span></span>
        <span class="figure-label">Grades entered</span>
      </div>
      <p class="summary-note muted small">${
        has
          ? 'The weighted average counts each subject by its credits and each grade by its weight inside the subject. The plain mean counts every grade the same, from a weekly test to a final exam.'
          : 'Enter a grade in any subject and the charts on this page fill in. The dates further down already work.'
      }</p>
    </section>

    ${has ? timelineBlock(rows, all) : ''}

    ${
      has
        ? `<div class="st-pair">
            <section class="block" aria-labelledby="h-decided">
              <div class="block-head"><h2 class="section-title" id="h-decided">Points decided</h2></div>
              <div class="card st-card">${decided(rows)}</div>
            </section>
            <section class="block" aria-labelledby="h-target">
              <div class="block-head"><h2 class="section-title" id="h-target">Against your target</h2></div>
              <div class="card st-card">${againstTarget(rows)}</div>
            </section>
          </div>
          <section class="block" aria-labelledby="h-spread">
            <div class="block-head"><h2 class="section-title" id="h-spread">Spread by subject</h2></div>
            <div class="card table-card">${spread(rows)}</div>
            <p class="st-foot muted small">Mean and σ count every grade the same, whatever its weight. σ is the sample standard deviation (n − 1). The box runs from the first to the third quartile, the line inside is the median and the whiskers reach the lowest and highest grade.</p>
          </section>
          <section class="block" aria-labelledby="h-chance">
            <div class="block-head"><h2 class="section-title" id="h-chance">Chance of passing</h2></div>
            <div class="card st-card" id="st-mc"><p class="muted st-wait">Simulating 1,000 semesters…</p></div>
            <p class="st-foot muted small">A Monte Carlo simulation: every grade you are still missing is drawn at random, following the mean and spread of the grades you already have in that subject (all your grades when a subject has fewer than two). Minimum grades are checked as usual. The same grades always give the same result.</p>
          </section>`
        : ''
    }

    <div class="st-pair">
      <section class="block" aria-labelledby="h-gain">
        <div class="block-head"><h2 class="section-title" id="h-gain">Where a point counts most</h2></div>
        <div class="card st-card">${gains(rows)}</div>
      </section>
      ${
        has
          ? `<section class="block" aria-labelledby="h-records">
              <div class="block-head"><h2 class="section-title" id="h-records">Records</h2></div>
              <div class="st-tiles st-tiles-2">${records(all)}</div>
            </section>`
          : ''
      }
    </div>

    <section class="block" aria-labelledby="h-load">
      <div class="block-head"><h2 class="section-title" id="h-load">Semester load</h2></div>
      <div class="card st-card st-heat-card" id="st-heat"></div>
      <p class="st-foot muted small" id="st-heat-note"></p>
    </section>

    ${
      has
        ? `<section class="block" aria-labelledby="h-nerd">
            <div class="block-head"><h2 class="section-title" id="h-nerd">For the nerds</h2></div>
            <div class="st-tiles st-tiles-4">${nerd(rows, all)}</div>
          </section>`
        : ''
    }`;

  countTo(root.querySelector('#st-ects'), ectsAvg);
  countTo(root.querySelector('#st-plain'), mean(values));

  const draw = () => {
    if (has) drawTimeline(root, rows, all);
    drawHeat(root, rows);
  };
  draw();
  wireTimelineToggle(root);
  wireGains(root);

  if (has) {
    // the simulation runs after the page has painted
    const seed = hash(JSON.stringify(rows.map((r) => [r.s.id, r.grades, r.target])));
    setTimeout(() => {
      const box = root.querySelector('#st-mc');
      if (box) box.innerHTML = chance(simulate(rows, { runs: 1000, seed }), rows);
    }, 30);
  }

  ro?.disconnect();
  lastWidth = root.clientWidth;
  ro = new ResizeObserver(() => {
    if (!root.isConnected || !root.querySelector('#st-heat')) return ro.disconnect();
    if (Math.abs(root.clientWidth - lastWidth) < 8) return;
    lastWidth = root.clientWidth;
    draw();
  });
  ro.observe(root);
}

/* ---------- Tooltip shared by the charts ---------- */
function tooltip(box) {
  let tip = box.querySelector('.st-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'st-tip';
    tip.setAttribute('role', 'status');
    box.append(tip);
  }
  return {
    show(html, x, y) {
      tip.innerHTML = html;
      tip.classList.add('is-on');
      const bw = box.clientWidth;
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      let left = x - tw / 2;
      left = Math.max(4, Math.min(bw - tw - 4, left));
      const top = y - th - 14 < 0 ? y + 16 : y - th - 14;
      tip.style.transform = `translate(${left}px, ${top}px)`;
    },
    hide() {
      tip.classList.remove('is-on');
    },
  };
}

const legendDots = (rows) =>
  rows
    .filter((r) => r.graded.length)
    .map((r) => `<li data-color="${esc(r.s.color)}"><span class="key key-dot"></span>${esc(r.s.code)}</li>`)
    .join('');

/* ---------- 1. Timeline ---------- */
function timelineBlock(rows, all) {
  const undated = all.filter((g) => !g.date).length;
  const dated = all.filter((g) => g.date).sort((a, b) => a.date.localeCompare(b.date));
  return `
    <section class="block" aria-labelledby="h-time">
      <div class="block-head">
        <h2 class="section-title" id="h-time">Every grade, in order</h2>
        <div class="segmented" role="group" aria-label="Show as">
          <button type="button" aria-pressed="true" data-view="chart">Chart</button>
          <button type="button" aria-pressed="false" data-view="table">Table</button>
        </div>
      </div>
      <div class="card st-card st-chart" id="st-time"></div>
      <div class="card table-card" id="st-time-table" hidden>
        <table class="strip st-table">
          <caption class="sr-only">Every grade with its date</caption>
          <thead><tr><th scope="col">Assessment</th><th scope="col">Date</th><th scope="col" class="num-col">Grade</th><th scope="col" class="num-col">Weight</th></tr></thead>
          <tbody>${[...dated, ...all.filter((g) => !g.date)]
            .map(
              (g) => `
            <tr data-color="${esc(g.s.color)}">
              <th scope="row"><span class="st-name"><span class="code-dot" aria-hidden="true"></span><b>${esc(g.s.code)}</b> ${esc(g.item.name)}</span></th>
              <td class="st-date muted">${g.date ? fmtDate(g.date) : 'No date'}</td>
              <td class="num-col num" data-l="Grade">${fmt(g.v)}</td>
              <td class="num-col num" data-l="Weight in ${esc(g.s.code)}">${pctFine(g.frac)}</td>
            </tr>`,
            )
            .join('')}</tbody>
        </table>
      </div>
      <ul class="legend st-legend" aria-hidden="true">
        ${legendDots(rows)}
        <li><span class="key key-line"></span>Average weighted by ECTS</li>
        <li><span class="key key-pass-line"></span>Pass</li>
      </ul>
      <p class="st-foot muted small">Bigger dots weigh more in your semester.${
        undated ? ` ${undated} ${undated === 1 ? 'grade has' : 'grades have'} no date and ${undated === 1 ? 'is' : 'are'} only in the table.` : ''
      }</p>
    </section>`;
}

function wireTimelineToggle(root) {
  const seg = root.querySelector('#h-time')?.closest('.block')?.querySelector('.segmented');
  if (!seg) return;
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b) return;
    const table = b.dataset.view === 'table';
    seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    root.querySelector('#st-time').hidden = table;
    root.querySelector('#st-time-table').hidden = !table;
  });
}

function drawTimeline(root, rows, all) {
  const box = root.querySelector('#st-time');
  if (!box) return;
  const pts = all.filter((g) => g.date);
  if (!pts.length) {
    box.innerHTML = '<p class="muted st-wait">None of your grades has a date yet. They are listed in the table.</p>';
    return;
  }
  const W = Math.max(260, inner(box));
  const H = W < 560 ? 230 : 290;
  const m = { l: 30, r: 12, t: 14, b: 28 };
  const t0 = Math.min(...pts.map((g) => parseDate(g.date).getTime())) - 5 * DAY;
  const t1 = Math.max(today().getTime(), ...pts.map((g) => parseDate(g.date).getTime())) + 5 * DAY;
  const x = (t) => m.l + ((t - t0) / (t1 - t0)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 10) * (H - m.t - m.b);

  const grid = [0, 2, 4, 6, 8, 10]
    .map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="st-grid"/><text x="${m.l - 8}" y="${y(v) + 4}" class="st-axis" text-anchor="end">${v}</text>`)
    .join('');
  const months = [];
  for (let d = new Date(new Date(t0).getFullYear(), new Date(t0).getMonth() + 1, 1); d.getTime() < t1; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const px = x(d.getTime());
    months.push(`<line x1="${px}" x2="${px}" y1="${H - m.b}" y2="${H - m.b + 5}" class="st-tick"/><text x="${px + 4}" y="${H - 8}" class="st-axis">${new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d)}</text>`);
  }
  const now = today().getTime();
  const todayLine = now > t0 && now < t1 ? `<line x1="${x(now)}" x2="${x(now)}" y1="${m.t}" y2="${H - m.b}" class="st-today"/><text x="${x(now) - 4}" y="${m.t + 10}" class="st-axis" text-anchor="end">Today</text>` : '';

  const run = runningAverage(rows).filter((p) => p.value != null);
  const line = run.length > 1 ? `<path class="st-run" d="${run.map((p, i) => `${i ? 'L' : 'M'}${x(parseDate(p.date).getTime()).toFixed(1)},${y(p.value).toFixed(1)}`).join('')}"/>` : '';

  // grades on the same day sit side by side
  const byDay = new Map();
  for (const g of pts) {
    const k = g.date;
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(g);
  }
  const marks = [];
  for (const list of byDay.values()) {
    list.forEach((g, k) => {
      const r = Math.min(11, 4.5 + 26 * Math.sqrt(g.semester));
      marks.push({ g, cx: x(parseDate(g.date).getTime()) + (k - (list.length - 1) / 2) * 7, cy: y(g.v), r });
    });
  }
  marks.sort((a, b) => b.r - a.r);
  const last = run[run.length - 1];
  box.innerHTML = `
    <svg class="st-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="${esc(`${pts.length} grades from ${fmtDate(pts[0].date)} to ${fmtDate(pts[pts.length - 1].date)}. Your ECTS-weighted average is now ${fmt(last?.value)}.`)}">
      ${grid}${months.join('')}
      <line x1="${m.l}" x2="${W - m.r}" y1="${y(PASS)}" y2="${y(PASS)}" class="st-pass"/>
      ${todayLine}${line}
      ${marks.map((k, i) => `<circle class="st-dot" data-i="${i}" data-color="${esc(k.g.s.color)}" cx="${k.cx.toFixed(1)}" cy="${k.cy.toFixed(1)}" r="${k.r.toFixed(1)}"/>`).join('')}
      ${last ? `<circle class="st-run-end" cx="${x(parseDate(last.date).getTime())}" cy="${y(last.value)}" r="4"/>` : ''}
    </svg>`;
  const svg = box.querySelector('svg');
  const tip = tooltip(box);
  let active = null;
  const pick = (e) => {
    const r = svg.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    let best = null;
    let bd = 26;
    marks.forEach((k, i) => {
      const d = Math.hypot(k.cx - px, k.cy - py) - k.r;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (active != null) svg.querySelector(`[data-i="${active}"]`)?.classList.remove('is-hot');
    active = best;
    if (best == null) return tip.hide();
    const k = marks[best];
    svg.querySelector(`[data-i="${best}"]`)?.classList.add('is-hot');
    tip.show(
      `<span class="st-tip-head" data-color="${esc(k.g.s.color)}"><span class="code-dot"></span>${esc(k.g.s.code)}</span>
       <strong>${esc(k.g.item.name)}</strong>
       <span class="st-tip-num num">${fmt(k.g.v)}</span>
       <span class="muted">${fmtDate(k.g.date)}. ${pctFine(k.g.frac)} of ${esc(k.g.s.code)}</span>`,
      k.cx,
      k.cy - k.r,
    );
  };
  svg.addEventListener('pointermove', pick);
  svg.addEventListener('pointerdown', pick);
  svg.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      tip.hide();
      if (active != null) svg.querySelector(`[data-i="${active}"]`)?.classList.remove('is-hot');
      active = null;
    }
  });
}

/* ---------- 4. Points decided ---------- */
function decided(rows) {
  const list = rows
    .map((r) => {
      const sec = r.ev.secured;
      const lost = Math.max(0, r.ev.gradedFrac * 10 - sec);
      const play = Math.max(0, 10 - sec - lost);
      return `
        <li class="st-row" data-color="${esc(r.s.color)}">
          <span class="st-code"><span class="code-dot" aria-hidden="true"></span>${esc(r.s.code)}</span>
          <span class="st-stack" aria-hidden="true">
            ${sec > 0.005 ? `<i class="seg-sec" style="flex:${sec}"></i>` : ''}
            ${lost > 0.005 ? `<i class="seg-lost" style="flex:${lost}"></i>` : ''}
            ${play > 0.005 ? `<i class="seg-play" style="flex:${play}"></i>` : ''}
          </span>
          <span class="st-val num">${pct(r.ev.gradedFrac)}</span>
          <span class="sr-only">${esc(r.s.code)}: ${fmt(sec)} points secured, ${fmt(lost)} lost and ${fmt(play)} still in play, out of 10.</span>
        </li>`;
    })
    .join('');
  return `
    <p class="st-lead muted small">Out of the 10 points of each subject. The figure is how much of the subject is already graded.</p>
    <ul class="st-rows">${list}</ul>
    <ul class="legend" aria-hidden="true">
      <li><span class="key key-sec-n"></span>Secured</li>
      <li><span class="key key-lost"></span>Lost</li>
      <li><span class="key key-play-n"></span>Still in play</li>
    </ul>`;
}

/* ---------- 9. Against your target ---------- */
function againstTarget(rows) {
  const data = rows
    .map((r) => ({ r, v: r.ev.projected ?? r.ev.average }))
    .map((d) => ({ ...d, delta: d.v == null ? null : d.v - d.r.target }))
    .sort((a, b) => (b.delta ?? -99) - (a.delta ?? -99));
  const span = Math.max(2, Math.ceil(Math.max(...data.map((d) => Math.abs(d.delta ?? 0)))));
  const list = data
    .map(({ r, delta }) => {
      if (delta == null)
        return `<li class="st-row" data-color="${esc(r.s.color)}"><span class="st-code"><span class="code-dot" aria-hidden="true"></span>${esc(r.s.code)}</span><span class="st-div st-div-empty muted small">No grades yet</span><span class="st-val"></span></li>`;
      const w = (Math.abs(delta) / span) * 50;
      const left = delta >= 0 ? 50 : 50 - w;
      return `
        <li class="st-row" data-color="${esc(r.s.color)}">
          <span class="st-code"><span class="code-dot" aria-hidden="true"></span>${esc(r.s.code)}</span>
          <span class="st-div" aria-hidden="true"><i class="st-div-bar${delta < 0 ? ' is-neg' : ''}" style="left:${left}%;width:${Math.max(w, 0.8)}%"></i></span>
          <span class="st-val num">${signed(delta)}</span>
          <span class="sr-only">${esc(r.s.code)}: heading for ${fmt(delta + r.target)}, ${delta >= 0 ? 'above' : 'below'} your target of ${r.target} by ${fmt(Math.abs(delta))}.</span>
        </li>`;
    })
    .join('');
  return `
    <p class="st-lead muted small">Projected grade minus your target in each subject. Set a target inside each subject; it is 5 until you do.</p>
    <ul class="st-rows">${list}</ul>
    <div class="st-div-axis num" aria-hidden="true"><span>−${span}</span><span>Target</span><span>+${span}</span></div>`;
}

/* ---------- 3. Spread by subject ---------- */
function boxPlot(vals, color) {
  if (!vals.length) return '<span class="muted small">No grades yet</span>';
  const s = [...vals].sort((a, b) => a - b);
  const dots = s.map((v) => `<i class="bp-dot" style="left:${p10(v)}"></i>`).join('');
  const whole = s.length >= 4
    ? `<i class="bp-whisk" style="left:${p10(s[0])};width:calc(${p10(s[s.length - 1])} - ${p10(s[0])})"></i>
       <i class="bp-box" style="left:${p10(quantile(s, 0.25))};width:calc(${p10(quantile(s, 0.75))} - ${p10(quantile(s, 0.25))})"></i>
       <i class="bp-med" style="left:${p10(median(s))}"></i>`
    : '';
  return `<span class="bp" data-color="${esc(color)}" aria-hidden="true"><i class="bp-pass"></i>${whole}${dots}</span>`;
}

function spread(rows) {
  return `
    <table class="strip st-table st-spread">
      <caption class="sr-only">Spread of your grades in each subject</caption>
      <thead>
        <tr>
          <th scope="col">Subject</th>
          <th scope="col" class="col-scale"><span class="axis" aria-hidden="true"><span>0</span><span>5</span><span>10</span></span><span class="sr-only">Distribution</span></th>
          <th scope="col" class="num-col">Mean</th>
          <th scope="col" class="num-col">σ</th>
          <th scope="col" class="num-col">Range</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((r) => {
            const v = r.graded.map((g) => g.v);
            return `
          <tr data-color="${esc(r.s.color)}">
            <th scope="row"><a href="#/s/${esc(r.s.id)}"><span class="code-dot" aria-hidden="true"></span>${esc(r.s.code)}</a><span class="muted small">${v.length} ${v.length === 1 ? 'grade' : 'grades'}</span></th>
            <td class="col-scale">${boxPlot(v, r.s.color)}</td>
            <td class="num-col num" data-l="Mean">${fmt(mean(v))}</td>
            <td class="num-col num" data-l="σ">${fmt(sd(v))}</td>
            <td class="num-col num" data-l="Range">${v.length ? `${fmt(Math.min(...v), 1)}–${fmt(Math.max(...v), 1)}` : '–'}</td>
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>`;
}

/* ---------- 5. Chance of passing ---------- */
function histogram(xs) {
  const lo = Math.max(0, Math.floor(quantile(xs, 0.005) * 4) / 4 - 0.25);
  const hi = Math.min(10, Math.ceil(quantile(xs, 0.995) * 4) / 4 + 0.25);
  const n = 40;
  const w = (hi - lo) / n || 0.05;
  const bins = Array(n).fill(0);
  for (const v of xs) bins[Math.min(n - 1, Math.max(0, Math.floor((v - lo) / w)))]++;
  const top = Math.max(...bins);
  const q1 = quantile(xs, 0.1);
  const q9 = quantile(xs, 0.9);
  const med = median(xs);
  const pos = (v) => `${(((v - lo) / (hi - lo)) * 100).toFixed(2)}%`;
  const bars = bins
    .map((c, i) => {
      const mid = lo + (i + 0.5) * w;
      const h = top ? (c / top) * 100 : 0;
      return `<rect x="${i + 0.08}" y="${100 - h}" width="0.84" height="${h}" class="${mid >= q1 && mid <= q9 ? 'hb-in' : 'hb-out'}"/>`;
    })
    .join('');
  const ticks = [];
  for (let t = Math.ceil(lo); t <= Math.floor(hi); t++) ticks.push(`<span style="left:${pos(t)}">${t}</span>`);
  return `
    <div class="st-hist">
      <svg viewBox="0 0 ${n} 100" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>
      <i class="st-hist-med" style="left:${pos(med)}"></i>
    </div>
    <div class="st-hist-axis num" aria-hidden="true">${ticks.join('')}</div>`;
}

function chance(sim, rows) {
  const ok = sim.subjects.filter((o) => o.finals);
  if (!ok.length) return '<p class="muted st-wait">Enter a few grades to run the simulation.</p>';
  const sem = sim.semester;
  const anyTarget = rows.some((r) => r.target !== PASS);
  const list = sim.subjects
    .map((o) => {
      const r = o.r;
      if (!o.finals)
        return `<li class="st-mc-row" data-color="${esc(r.s.color)}"><span class="st-code"><span class="code-dot" aria-hidden="true"></span>${esc(r.s.code)}</span><span class="muted small st-mc-none">No grades to go on yet</span></li>`;
      const a = quantile(o.finals, 0.1);
      const b = quantile(o.finals, 0.9);
      const med = median(o.finals);
      return `
        <li class="st-mc-row" data-color="${esc(r.s.color)}">
          <span class="st-code"><span class="code-dot" aria-hidden="true"></span>${esc(r.s.code)}</span>
          <span class="st-mc-p num">${pct(o.pass)}<span class="st-mc-unit">pass</span></span>
          ${anyTarget ? `<span class="st-mc-t num">${r.target === PASS ? '' : `${pct(o.hit)}<span class="st-mc-unit">reach ${r.target}</span>`}</span>` : ''}
          <span class="st-band" aria-hidden="true">
            <i class="bp-pass"></i>
            ${r.target !== PASS ? `<i class="st-band-target" style="left:${p10(r.target)}"></i>` : ''}
            <i class="st-band-range" style="left:${p10(a)};width:max(3px, calc(${p10(b)} - ${p10(a)}))"></i>
            <i class="st-band-med" style="left:${p10(med)}"></i>
          </span>
          <span class="st-val num">${fmt(med)}</span>
          <span class="sr-only">${esc(r.s.code)}: passes in ${pct(o.pass)} of simulations${r.target !== PASS ? `, reaches ${r.target} in ${pct(o.hit)}` : ''}. Most likely final ${fmt(med)}, 8 in 10 between ${fmt(a)} and ${fmt(b)}.</span>
        </li>`;
    })
    .join('');
  return `
    <div class="st-mc-top">
      <div class="figure">
        <span class="figure-num num">${pct(sim.allPass)}</span>
        <span class="figure-label">Chance of passing every subject</span>
      </div>
      <div class="figure">
        <span class="figure-num num">${fmt(median(sem))}</span>
        <span class="figure-label">Most likely semester average. 8 in 10 runs land between ${fmt(quantile(sem, 0.1))} and ${fmt(quantile(sem, 0.9))}.</span>
      </div>
    </div>
    ${histogram(sem)}
    <p class="st-hist-cap muted small">Semester average in ${sim.runs.toLocaleString('en-GB')} simulated semesters</p>
    <ul class="st-mc-list${anyTarget ? ' has-target' : ''}">${list}</ul>
    <ul class="legend" aria-hidden="true">
      <li><span class="key key-band"></span>8 in 10 runs</li>
      <li><span class="key key-med"></span>Most likely final</li>
      <li><span class="key key-pass"></span>Pass</li>
      ${anyTarget ? '<li><span class="key key-tgt"></span>Your target</li>' : ''}
    </ul>`;
}

/* ---------- 6. Where a point counts most ---------- */
function gains(rows) {
  const list = sensitivity(rows);
  if (!list.length) return '<p class="muted st-wait">Everything is graded. Nothing left to gain.</p>';
  const top = list[0].semesterGain;
  const item = (o, i) => `
    <li class="st-gain${i >= 6 ? ' is-extra' : ''}" data-color="${esc(o.s.color)}"${i >= 6 ? ' hidden' : ''}>
      <span class="st-gain-name"><span class="code-dot" aria-hidden="true"></span><b>${esc(o.s.code)}</b> ${esc(o.item.name)}</span>
      <span class="st-gain-meta muted small">${o.date ? `${fmtDate(o.date)}, ${relDay(o.date)}. ` : ''}${signed(o.subjectGain * 1, 2)} on ${esc(o.s.code)}${o.item.min != null ? `. Needs at least ${o.item.min}` : ''}</span>
      <span class="st-gain-bar" aria-hidden="true"><i style="width:${((o.semesterGain / top) * 100).toFixed(1)}%"></i></span>
      <span class="st-val num">${signed(o.semesterGain, 3)}</span>
    </li>`;
  return `
    <p class="st-lead muted small">What one more point in each pending assessment adds to your semester average.</p>
    <ol class="st-gains">${list.map(item).join('')}</ol>
    ${list.length > 6 ? `<button type="button" class="link-btn st-more" aria-expanded="false">Show all ${list.length}</button>` : ''}`;
}

function wireGains(root) {
  const b = root.querySelector('.st-more');
  if (!b) return;
  b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') !== 'true';
    root.querySelectorAll('.st-gain.is-extra').forEach((li) => (li.hidden = !open));
    b.setAttribute('aria-expanded', String(open));
    b.textContent = open ? 'Show fewer' : `Show all ${root.querySelectorAll('.st-gain').length}`;
  });
}

/* ---------- 7. Records ---------- */
function records(all) {
  const ordered = [...all].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const vals = ordered.map((g) => g.v);
  const best = ordered.reduce((m, g) => (g.v > m.v ? g : m), ordered[0]);
  const nine = vals.filter((v) => v >= 9).length;
  const seven = vals.filter((v) => v >= 7).length;
  const passed = vals.filter((v) => v >= PASS).length;
  const { best: longest, current } = streaks(vals, 7);
  const tile = (num, label, note = '') => `
    <div class="card st-tile">
      <span class="st-tile-num num">${num}</span>
      <span class="st-tile-label">${label}</span>
      ${note ? `<span class="st-tile-note muted small">${note}</span>` : ''}
    </div>`;
  return [
    tile(fmt(best.v), 'Best grade', `${esc(best.s.code)} ${esc(best.item.name)}`),
    tile(nine, nine === 1 ? 'Grade of 9 or more' : 'Grades of 9 or more', `${pct(nine / vals.length)} of your grades`),
    tile(current, 'Current streak', `${current === 1 ? 'Latest grade is' : 'Grades in a row'} at 7 or more`),
    tile(longest, 'Longest streak', 'Grades in a row at 7 or more'),
    tile(pct(seven / vals.length), 'At 7 or more', `${seven} of ${vals.length} grades`),
    tile(`${passed}/${vals.length}`, 'Passed', 'Grades at 5 or more'),
  ].join('');
}

/* ---------- 8. Semester load ---------- */
function drawHeat(root, rows) {
  const box = root.querySelector('#st-heat');
  const note = root.querySelector('#st-heat-note');
  if (!box) return;
  const days = workload(rows);
  if (!days.size) {
    box.innerHTML = '<p class="muted st-wait">Your subjects have no dates yet.</p>';
    return;
  }
  const keys = [...days.keys()].sort();
  const monday = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  const start = monday(parseDate(keys[0]));
  const end = parseDate(keys[keys.length - 1]);
  const weeks = Math.floor((monday(end) - start) / (7 * DAY)) + 1;
  const wide = box.clientWidth >= 820;
  box.classList.toggle('is-wide', wide);
  const W = Math.max(260, inner(box) - (wide ? 300 : 0));
  const lab = 22;
  const gap = W < 520 ? 2 : 4;
  const cell = Math.max(9, Math.min(32, Math.floor((W - lab) / weeks) - gap));
  const width = lab + weeks * (cell + gap);
  const top = 18;
  const height = top + 7 * (cell + gap);
  const level = (d) => (!d ? 0 : d.load > 0.06 ? 4 : d.load > 0.03 ? 3 : d.load > 0.01 ? 2 : 1);
  const nowIso = iso(today());
  const cells = [];
  const monthLabels = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    for (let k = 0; k < 7; k++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + k);
      const key = iso(d);
      const info = days.get(key);
      // a month is named on its first week; the first column only when that month lasts two more weeks
      const roomy = w > 0 || new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() >= 13;
      if (k === 0 && d.getMonth() !== lastMonth && (d.getDate() <= 7 || w === 0) && roomy) {
        lastMonth = d.getMonth();
        monthLabels.push(`<text x="${lab + w * (cell + gap)}" y="11" class="st-axis">${new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d)}</text>`);
      }
      cells.push(
        `<rect x="${lab + w * (cell + gap)}" y="${top + k * (cell + gap)}" width="${cell}" height="${cell}" rx="3" class="hm hm-${level(info)}${key === nowIso ? ' hm-today' : ''}" data-d="${key}"/>`,
      );
    }
  }
  const dayLabels = ['M', '', 'W', '', 'F', '', 'S']
    .map((t, k) => (t ? `<text x="0" y="${top + k * (cell + gap) + cell - 2}" class="st-axis">${t}</text>` : ''))
    .join('');

  // busiest week and what is still ahead
  const weekLoad = new Map();
  for (const [k, d] of days) {
    const wk = iso(monday(parseDate(k)));
    weekLoad.set(wk, (weekLoad.get(wk) || 0) + d.load);
  }
  const [bw, bl] = [...weekLoad.entries()].sort((a, b) => b[1] - a[1])[0];
  const ahead = [...days.values()].filter((d) => d.date >= nowIso).reduce((a, d) => a + d.load, 0);
  const bwEnd = iso(new Date(parseDate(bw).getTime() + 6 * DAY));
  const big = [...days.values()].filter((d) => d.date >= nowIso && d.load > 0.03).sort((a, b) => a.date.localeCompare(b.date))[0];
  const short = { day: 'numeric', month: 'short' };

  box.innerHTML = `
    <div class="st-heat-scroll">
      <svg class="st-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"
        aria-label="${esc(`Calendar of the semester. The busiest week, starting ${fmtDate(bw, { day: 'numeric', month: 'long' })}, holds ${pct(bl)} of your marks.`)}">
        ${monthLabels.join('')}${dayLabels}${cells.join('')}
      </svg>
    </div>
    <div class="st-heat-legend" aria-hidden="true"><span>Less</span>${[0, 1, 2, 3, 4].map((l) => `<i class="hm-key hm-${l}"></i>`).join('')}<span>More of your marks due</span></div>
    <dl class="st-heat-facts">
      <div><dt>Busiest week</dt><dd><span class="num">${fmtDate(bw, short)} to ${fmtDate(bwEnd, short)}</span><span class="muted small">${pct(bl)} of the semester's marks</span></dd></div>
      <div><dt>Still ahead</dt><dd><span class="num">${pct(ahead)}</span><span class="muted small">of your marks are dated from today on</span></dd></div>
      ${big ? `<div><dt>Next big day</dt><dd><span class="num">${fmtDate(big.date)}</span><span class="muted small">${esc(big.items.map((i) => i.label).join(', '))}, ${relDay(big.date)}</span></dd></div>` : ''}
    </dl>`;
  note.textContent = 'Each square is a day. The darker it is, the bigger the share of your semester mark due that day, with subjects weighted by ECTS.';

  const svg = box.querySelector('svg');
  const tip = tooltip(box);
  const show = (e) => {
    const rect = e.target.closest?.('rect.hm');
    if (!rect) return tip.hide();
    const d = days.get(rect.dataset.d);
    const br = box.getBoundingClientRect();
    const rr = rect.getBoundingClientRect();
    tip.show(
      `<strong>${fmtDate(rect.dataset.d, { weekday: 'long', day: 'numeric', month: 'long' })}</strong>${
        d
          ? `${d.items.map((it) => `<span class="st-tip-item" data-color="${esc(it.color)}"><span class="code-dot"></span>${esc(it.label)}</span>`).join('')}${d.load > 0 ? `<span class="muted">${pctFine(d.load)} of the semester</span>` : ''}`
          : '<span class="muted">Nothing due</span>'
      }`,
      rr.left - br.left + rr.width / 2,
      rr.top - br.top,
    );
  };
  svg.addEventListener('pointermove', show);
  svg.addEventListener('pointerdown', show);
  svg.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && tip.hide());
}

/* ---------- 10. For the nerds ---------- */
function nerd(rows, all) {
  const v = all.map((g) => g.v);
  const m = mean(v);
  const s = sd(v);
  const skew = s && v.length >= 3 ? (v.length / ((v.length - 1) * (v.length - 2))) * v.reduce((a, x) => a + ((x - m) / s) ** 3, 0) : null;
  const dated = all.filter((g) => g.date);
  const t0 = dated.length ? Math.min(...dated.map((g) => parseDate(g.date).getTime())) : 0;
  const reg = regression(dated.map((g) => [(parseDate(g.date).getTime() - t0) / (30.44 * DAY), g.v]));
  const pairs = rows
    .map((r) => {
      const ex = r.graded.filter((g) => g.exam).map((g) => g.v);
      const pr = r.graded.filter((g) => !g.exam).map((g) => g.v);
      return ex.length && pr.length ? [mean(pr), mean(ex)] : null;
    })
    .filter(Boolean);
  const r = pearson(pairs);
  const gpaRows = rows.filter((x) => x.ev.average != null);
  const gpa = gpaRows.length ? weightedMean(gpaRows.map((x) => ({ value: gpaPoints(x.ev.average), ects: x.ects }))) : null;
  const tile = (num, label, note) => `
    <div class="card st-tile">
      <span class="st-tile-label">${label}</span>
      <span class="st-tile-num num">${num}</span>
      <span class="st-tile-note muted small">${note}</span>
    </div>`;
  return [
    tile(fmt(median(v)), 'Median', v.length >= 4 ? `Half your grades sit between ${fmt(quantile(v, 0.25))} and ${fmt(quantile(v, 0.75))}.` : 'The middle of your grades.'),
    tile(fmt(geometricMean(v)), 'Geometric mean', 'Punishes a single low grade more than the plain mean.'),
    tile(fmt(harmonicMean(v)), 'Harmonic mean', 'Even harder on low grades. Always at or below the geometric mean.'),
    tile(fmt(s), 'Standard deviation', s != null && m ? `Coefficient of variation ${pct(s / m)}.` : 'Needs two grades.'),
    tile(skew == null ? '–' : signed(skew), 'Skewness', skew == null ? 'Needs three grades.' : skew < -0.2 ? 'Negative: most grades are high, with a tail of lower ones.' : skew > 0.2 ? 'Positive: most grades are lower, with a few high ones.' : 'Close to symmetric.'),
    tile(reg ? signed(reg.b) : '–', 'Trend per month', reg ? `Least-squares slope of your grades over time. R² = ${fmt(reg.r2)}.` : 'Needs three dated grades.'),
    tile(r == null ? '–' : signed(r), 'Practical vs exam', r == null ? `Pearson r across subjects with both. Needs 3 subjects, you have ${pairs.length}.` : `Pearson r across ${pairs.length} subjects. ${Math.abs(r) < 0.3 ? 'Barely related.' : r > 0 ? 'Good practicals go with good exams.' : 'Your strong practicals and exams are in different subjects.'}`),
    tile(gpa == null ? '–' : gpa.toFixed(2), 'GPA, 4.0 scale', 'A rough conversion: 9 or more is 4, 7 is 3, 5 is 2. Every university converts its own way.'),
  ].join('');
}
