// Statistics over the student's own grades. Pure functions, no DOM.
import { evaluate, flatten, leafValue, PASS } from './grades.js';

const EPS = 1e-9;

export const mean = (xs) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null);

/** Sample standard deviation (n − 1). Null below two values. */
export function sd(xs) {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/** Quantile with linear interpolation between order statistics (R type 7). */
export function quantile(xs, q) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const h = (s.length - 1) * q;
  const lo = Math.floor(h);
  return s[lo] + (h - lo) * ((s[Math.ceil(h)] ?? s[lo]) - s[lo]);
}

export const median = (xs) => quantile(xs, 0.5);

export function geometricMean(xs) {
  if (!xs.length || xs.some((x) => x <= 0)) return null;
  return Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
}

export function harmonicMean(xs) {
  if (!xs.length || xs.some((x) => x <= 0)) return null;
  return xs.length / xs.reduce((a, x) => a + 1 / x, 0);
}

/** Pearson correlation of paired values. Null below three pairs or with no spread. */
export function pearson(pairs) {
  if (pairs.length < 3) return null;
  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  return sxx > EPS && syy > EPS ? sxy / Math.sqrt(sxx * syy) : null;
}

/** Least-squares line y = a + b·x and its R². */
export function regression(pts) {
  if (pts.length < 3) return null;
  const mx = mean(pts.map((p) => p[0]));
  const my = mean(pts.map((p) => p[1]));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of pts) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  if (sxx < EPS) return null;
  const b = sxy / sxx;
  return { a: my - b * mx, b, r2: syy > EPS ? (sxy * sxy) / (sxx * syy) : 1 };
}

/** Rough 4.0 scale: A from 9, B from 7, C from 5. Universities convert differently. */
export const gpaPoints = (g) => (g >= 9 ? 4 : g >= 7 ? 3 : g >= 5 ? 2 : 0);

/** Small, fast, seedable random numbers, so the same grades always give the same simulation. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function gauss(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/**
 * Everything the Stats page needs from the student's data.
 * `subjects`: [{ s, grades, target }]. Undated grades use the day they were typed (`at`), when known.
 */
export function collect(subjects) {
  const totalEcts = subjects.reduce((a, x) => a + (Number(x.s.ects) || 0), 0) || 1;
  return subjects.map(({ s, grades, target }) => {
    const ects = Number(s.ects) || 0;
    const ev = evaluate(s, grades);
    const graded = [];
    const open = [];
    for (const n of flatten(s.items)) {
      if (!n.isLeaf) continue;
      const entry = grades[n.item.id];
      const v = leafValue(n.item, entry);
      const base = { s, item: n.item, frac: n.frac, semester: (n.frac * ects) / totalEcts, exam: n.item.kind === 'exam' };
      if (v != null) graded.push({ ...base, v, date: n.item.date || entry?.at || null });
      else open.push({ ...base, date: n.item.date || null });
    }
    return { s, grades, target, ects, ev, graded, open };
  });
}

/** ECTS-weighted average of subject averages, using only grades dated on or before each day. */
export function runningAverage(rows) {
  const dated = rows.flatMap((r) => r.graded.filter((g) => g.date)).sort((a, b) => a.date.localeCompare(b.date));
  const days = [...new Set(dated.map((g) => g.date))];
  return days.map((day) => {
    let acc = 0;
    let w = 0;
    for (const r of rows) {
      const upTo = r.graded.filter((g) => g.date && g.date <= day);
      const f = upTo.reduce((a, g) => a + g.frac, 0);
      if (f < EPS) continue;
      acc += (upTo.reduce((a, g) => a + g.frac * g.v, 0) / f) * r.ects;
      w += r.ects;
    }
    return { date: day, value: w ? acc / w : null };
  });
}

/** Longest run and current run (ending at the latest grade) of grades at or above `bar`, in date order. */
export function streaks(values, bar = 7) {
  let best = 0;
  let run = 0;
  for (const v of values) {
    run = v + EPS >= bar ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { best, current: run };
}

/**
 * Monte Carlo of each subject's final mark. Ungraded parts are drawn from a normal
 * distribution with the mean and spread of the student's grades in that subject
 * (all their grades when a subject has fewer than two), rounded to 0.1 and kept in 0–10.
 */
export function simulate(rows, { runs = 1000, seed = 1 } = {}) {
  const pooled = rows.flatMap((r) => r.graded.map((g) => g.v));
  const rand = rng(seed);
  const out = rows.map((r) => {
    const own = r.graded.map((g) => g.v);
    const base = own.length >= 2 ? own : pooled;
    if (!r.open.length) {
      const final = r.ev.secured;
      const pass = r.ev.status === 'passed';
      return { r, fixed: true, finals: Array(runs).fill(final), pass: pass ? 1 : 0, hit: pass && final + EPS >= r.target ? 1 : 0 };
    }
    if (base.length < 1) return { r, finals: null };
    const mu = mean(base);
    const sigma = Math.max(0.6, sd(base) ?? 1.2);
    const finals = new Array(runs);
    let pass = 0;
    let hit = 0;
    const g = { ...r.grades };
    for (let i = 0; i < runs; i++) {
      for (const o of r.open) g[o.item.id] = { v: Math.round(Math.min(10, Math.max(0, mu + sigma * gauss(rand))) * 10) / 10 };
      const ev = evaluate(r.s, g);
      finals[i] = ev.secured;
      if (ev.status === 'passed') {
        pass++;
        if (ev.secured + EPS >= r.target) hit++;
      }
    }
    return { r, mu, sigma, finals, pass: pass / runs, hit: hit / runs };
  });
  // semester average of each run, weighted by ECTS
  const ok = out.filter((o) => o.finals);
  const ects = ok.reduce((a, o) => a + o.r.ects, 0);
  const semester = ects
    ? Array.from({ length: runs }, (_, i) => ok.reduce((a, o) => a + o.finals[i] * o.r.ects, 0) / ects)
    : null;
  const allPass = ok.length ? ok.reduce((a, o) => a * o.pass, 1) : null;
  return { subjects: out, semester, allPass, runs };
}

/** How much one more point on each ungraded item moves the subject and the semester average. */
export function sensitivity(rows) {
  return rows
    .flatMap((r) => r.open.map((o) => ({ ...o, subjectGain: o.frac, semesterGain: o.semester })))
    .filter((o) => o.semesterGain > EPS)
    .sort((a, b) => b.semesterGain - a.semesterGain || (a.date || '9').localeCompare(b.date || '9'));
}

/** Share of the semester's marks due on each day (graded or not), plus the ungraded dates. */
export function workload(rows) {
  const days = new Map();
  const add = (date, w, label, color) => {
    if (!date) return;
    if (!days.has(date)) days.set(date, { date, load: 0, items: [] });
    const d = days.get(date);
    d.load += w;
    d.items.push({ label, color });
  };
  for (const r of rows) {
    for (const g of [...r.graded, ...r.open]) if (g.item.date) add(g.item.date, g.semester, `${r.s.code} ${g.item.name}`, r.s.color);
    for (const m of r.s.milestones || []) add(m.date, 0, `${r.s.code} ${m.name}`, r.s.color);
  }
  return days;
}

export { PASS };
