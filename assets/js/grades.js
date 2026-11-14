// Grade engine. Pure functions, no DOM.
//
// A subject is a tree of items. Every item has a `weight` that is relative to
// its siblings (weights are normalised, so 35/35/30 and 0.35/0.35/0.3 mean the
// same). Items with `children` are groups; items without are gradable leaves.
// A group's grade is the weighted mean of its children.
//
// Optional fields:
//   min     minimum grade that item (leaf or group) must reach to pass
//   retake  leaf can be resubmitted; a resubmitted grade is capped at `retake`
//   date    ISO date (YYYY-MM-DD) of the delivery or exam

export const PASS = 5;
const EPS = 1e-9;

export const round = (x, d = 2) =>
  x == null || Number.isNaN(x) ? null : Math.round(x * 10 ** d) / 10 ** d;

export const clamp = (x, lo = 0, hi = 10) => Math.min(hi, Math.max(lo, x));

/** Parse user input like "7,5" or "7.5". Returns number, null (empty) or NaN (invalid). */
export function parseGrade(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(',', '.');
  if (s === '') return null;
  if (!/^\d{1,2}(\.\d{0,3})?$/.test(s)) return NaN;
  const n = Number(s);
  return n >= 0 && n <= 10 ? n : NaN;
}

/** Depth-first walk with each node's fraction of the final mark. */
export function flatten(items, parentFrac = 1, depth = 0, parent = null, out = []) {
  const total = items.reduce((s, it) => s + Math.max(0, Number(it.weight) || 0), 0);
  for (const it of items) {
    const w = Math.max(0, Number(it.weight) || 0);
    const frac = total > 0 ? (parentFrac * w) / total : 0;
    const node = { item: it, frac, depth, parent, isLeaf: !it.children?.length };
    out.push(node);
    if (!node.isLeaf) flatten(it.children, frac, depth + 1, it.id, out);
  }
  return out;
}

export const leaves = (subject) => flatten(subject.items).filter((n) => n.isLeaf);

/** Effective grade of one leaf entry, applying the resubmission cap. */
export function leafValue(item, entry) {
  if (!entry || entry.v == null || Number.isNaN(entry.v)) return null;
  let v = clamp(entry.v);
  if (entry.retake && item.retake) v = Math.min(v, item.retake);
  return v;
}

/**
 * Compute a group's (or the whole subject's) grade.
 * `fill(item)` returns the value to use for an ungraded leaf, or null to skip it.
 * Returns { value, weightCovered } where value is the weighted mean over covered weight.
 */
function nodeGrade(items, grades, fill) {
  const total = items.reduce((s, it) => s + Math.max(0, Number(it.weight) || 0), 0);
  if (total <= 0) return { value: null, covered: 0 };
  let acc = 0;
  let covered = 0;
  for (const it of items) {
    const w = Math.max(0, Number(it.weight) || 0) / total;
    if (w === 0) continue;
    let v;
    let c;
    if (it.children?.length) {
      const g = nodeGrade(it.children, grades, fill);
      v = g.value;
      c = g.covered;
    } else {
      v = leafValue(it, grades[it.id]);
      if (v == null) v = fill(it);
      c = v == null ? 0 : 1;
    }
    if (v == null || c === 0) continue;
    acc += w * c * v;
    covered += w * c;
  }
  return { value: covered > EPS ? acc / covered : null, covered };
}

/** Grade of the subject (or of `items`) with ungraded leaves set to `x` (null = skip). */
function gradeWith(items, grades, x, sims) {
  return nodeGrade(items, grades, (it) => {
    if (sims && sims[it.id] != null) return sims[it.id];
    return x;
  });
}

/** Find an item by id anywhere in the tree. */
export function findItem(items, id) {
  for (const it of items) {
    if (it.id === id) return it;
    if (it.children?.length) {
      const f = findItem(it.children, id);
      if (f) return f;
    }
  }
  return null;
}

/** Names from the top-level item down to `id`, e.g. ['Work', 'Work 2', 'Code']. */
export function itemPath(items, id, trail = []) {
  for (const it of items) {
    const here = [...trail, it.name];
    if (it.id === id) return here;
    if (it.children?.length) {
      const f = itemPath(it.children, id, here);
      if (f) return f;
    }
  }
  return null;
}

function hasUngraded(item, grades) {
  if (!item.children?.length) return leafValue(item, grades[item.id]) == null;
  return item.children.some((c) => hasUngraded(c, grades));
}

/**
 * Full evaluation of a subject.
 * grades: { [leafId]: { v:number, retake?:bool } }
 * sims:   { [leafId]: number }  optional what-if values for ungraded leaves
 */
export function evaluate(subject, grades = {}, sims = null) {
  const flat = flatten(subject.items);
  const lv = flat.filter((n) => n.isLeaf);

  let secured = 0;
  let gradedFrac = 0;
  for (const n of lv) {
    const v = leafValue(n.item, grades[n.item.id]);
    if (v != null) {
      secured += n.frac * v;
      gradedFrac += n.frac;
    }
  }
  const remainingFrac = Math.max(0, 1 - gradedFrac);
  const average = gradedFrac > EPS ? secured / gradedFrac : null;
  const maxReachable = secured + remainingFrac * 10;

  // Projection: ungraded leaves take the simulated value if any, else the current average.
  let projected = null;
  if (sims && Object.keys(sims).length) {
    projected = gradeWith(subject.items, grades, average, sims).value;
  } else if (average != null) {
    projected = secured + remainingFrac * average;
  }

  // Per-node computed grades (graded part only) and the same with sims applied.
  const nodes = {};
  for (const n of flat) {
    const it = n.item;
    const items = n.isLeaf ? [it] : it.children;
    const real = gradeWith(items, grades, null, null);
    const sim = sims ? gradeWith(items, grades, null, sims) : real;
    nodes[it.id] = {
      frac: n.frac,
      depth: n.depth,
      isLeaf: n.isLeaf,
      value: real.value,
      covered: real.covered,
      simValue: sim.value,
      simCovered: sim.covered,
      complete: !hasUngraded(it, grades),
    };
  }

  // Requirements (minimum grades on items or groups).
  const requirements = flat
    .filter((n) => n.item.min != null && n.item.min !== '')
    .map((n) => {
      const it = n.item;
      const min = Number(it.min);
      const info = nodes[it.id];
      const items = n.isLeaf ? [it] : it.children;
      const best = gradeWith(items, grades, 10, null).value;
      let status;
      if (info.complete) status = info.value + EPS >= min ? 'met' : 'failed';
      else if (best != null && best + EPS < min) status = 'failed';
      else if (info.value == null) status = 'pending';
      else status = info.value + EPS >= min ? 'on-track' : 'at-risk';
      return { id: it.id, name: it.name, min, value: info.value, status };
    });

  const complete = remainingFrac < EPS;
  const failedReq = requirements.some((r) => r.status === 'failed');
  let status;
  if (failedReq) status = 'failed';
  else if (gradedFrac < EPS) status = 'not-started';
  else if (complete) status = secured + EPS >= PASS ? 'passed' : 'failed';
  else if (secured + EPS >= PASS && requirements.every((r) => r.status === 'met')) status = 'passed';
  else if (maxReachable + EPS < PASS) status = 'failed';
  else if ((average ?? 0) + EPS >= PASS && !requirements.some((r) => r.status === 'at-risk')) status = 'on-track';
  else status = 'at-risk';

  return {
    secured,
    gradedFrac,
    remainingFrac,
    average,
    projected,
    maxReachable,
    complete,
    status,
    requirements,
    nodes,
  };
}

/**
 * Lowest uniform grade x on every ungraded leaf that reaches `target`
 * and satisfies every minimum. Returns:
 *   { kind:'secured' }                      target already guaranteed
 *   { kind:'need', x, binding }             need average x on remaining
 *   { kind:'impossible', max }              not reachable even with 10s
 */
export function needed(subject, grades = {}, target = PASS) {
  const ev = evaluate(subject, grades);
  const flat = flatten(subject.items);
  const mins = flat.filter((n) => n.item.min != null && n.item.min !== '');

  const ok = (x) => {
    const g = gradeWith(subject.items, grades, x, null).value ?? 0;
    if (g + EPS < target) return false;
    for (const n of mins) {
      const items = n.isLeaf ? [n.item] : n.item.children;
      const v = gradeWith(items, grades, x, null).value;
      if (v == null || v + EPS < Number(n.item.min)) return false;
    }
    return true;
  };

  if (ev.remainingFrac < EPS) {
    return ok(0) ? { kind: 'secured' } : { kind: 'impossible', max: ev.secured };
  }
  if (ok(0)) return { kind: 'secured' };
  if (!ok(10)) return { kind: 'impossible', max: ev.maxReachable };

  let lo = 0;
  let hi = 10;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) hi = mid;
    else lo = mid;
  }
  const x = Math.ceil(hi * 100 - 1e-6) / 100;

  // Which constraint decided it: the overall target or a minimum?
  const overallOnly = (() => {
    let a = 0;
    let b = 10;
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      const g = gradeWith(subject.items, grades, m, null).value ?? 0;
      if (g + EPS >= target) b = m;
      else a = m;
    }
    return b;
  })();
  let binding = null;
  if (hi - overallOnly > 0.005) {
    for (const n of mins) {
      const items = n.isLeaf ? [n.item] : n.item.children;
      const v = gradeWith(items, grades, overallOnly, null).value;
      if (v == null || v + EPS < Number(n.item.min)) {
        binding = { id: n.item.id, name: n.item.name, min: Number(n.item.min) };
        break;
      }
    }
  }
  return { kind: 'need', x, binding };
}

/** ECTS-weighted mean of a list of {value, ects}; ignores nulls. */
export function weightedMean(rows) {
  let acc = 0;
  let w = 0;
  for (const r of rows) {
    if (r.value == null) continue;
    const e = Number(r.ects) || 0;
    acc += r.value * e;
    w += e;
  }
  return w > 0 ? acc / w : null;
}

/** All dated items of a subject (leaves, groups and ungraded milestones), sorted by date. */
export function datedItems(subject) {
  const graded = flatten(subject.items)
    .filter((n) => n.item.date)
    .map((n) => ({ ...n, date: n.item.date }));
  const milestones = (subject.milestones || [])
    .filter((m) => m.date)
    .map((m) => ({ item: m, frac: 0, depth: 0, parent: null, isLeaf: false, isMilestone: true, date: m.date }));
  return [...graded, ...milestones].sort((a, b) => a.date.localeCompare(b.date));
}
