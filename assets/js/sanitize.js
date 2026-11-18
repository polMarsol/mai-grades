// Saved data comes back from localStorage or from a backup file someone may have sent you.
// Before the app uses it, every field is reduced to the type it should have, so a crafted
// file cannot smuggle markup or scripts into the page. Unknown text fields are dropped.
import { COLORS } from './catalog.js';

const ID = /^[\w.-]{1,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const str = (x, max = 400) => (typeof x === 'string' ? x.slice(0, max) : typeof x === 'number' ? String(x) : undefined);
const num = (x, lo = -Infinity, hi = Infinity) => {
  if (x === '' || x == null || typeof x === 'boolean') return undefined;
  const n = Number(x);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : undefined;
};
const day = (x) => (typeof x === 'string' && DAY.test(x) ? x : undefined);
const id = (x) => (typeof x === 'string' && ID.test(x) ? x : undefined);
const url = (x) => (typeof x === 'string' && /^https?:\/\/[^\s"'<>]+$/i.test(x.trim()) ? x.trim() : undefined);
const bool = (x) => (typeof x === 'boolean' ? x : undefined);
const list = (x, f, max = 200) => (Array.isArray(x) ? x.slice(0, max).map(f).filter((v) => v !== undefined) : undefined);
const clean = (o) => {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
};

function exam(e) {
  if (!e || typeof e !== 'object') return undefined;
  return clean({
    duration: str(e.duration), format: str(e.format), covers: str(e.covers), allowed: str(e.allowed),
    source: str(e.source), prep: list(e.prep, (p) => str(p)),
  });
}

function item(it, depth = 0) {
  if (!it || typeof it !== 'object' || !id(it.id) || depth > 6) return undefined;
  return clean({
    id: it.id,
    name: str(it.name, 160) ?? 'Untitled',
    weight: num(it.weight, 0, 1e6) ?? 0,
    min: num(it.min, 0, 10),
    retake: num(it.retake, 0, 10),
    date: day(it.date),
    time: str(it.time, 40),
    place: str(it.place, 160),
    kind: ['exam', 'test'].includes(it.kind) ? it.kind : undefined,
    url: url(it.url),
    exam: exam(it.exam),
    edited: bool(it.edited),
    v: str(it.v, 20),
    children: list(it.children, (c) => item(c, depth + 1)),
  });
}

function milestone(m) {
  if (!m || typeof m !== 'object' || !id(m.id)) return undefined;
  return clean({ id: m.id, name: str(m.name, 160) ?? 'Untitled', date: day(m.date), time: str(m.time, 40), url: url(m.url) });
}

export function sanitizeSubject(s) {
  if (!s || typeof s !== 'object' || !id(s.id)) return undefined;
  return clean({
    id: s.id,
    code: str(s.code, 12) ?? s.id.slice(0, 12),
    name: str(s.name, 120) ?? s.id,
    university: str(s.university, 20),
    ects: num(s.ects, 0, 60),
    color: COLORS.includes(s.color) ? s.color : COLORS[0],
    rule: str(s.rule),
    source: str(s.source),
    url: url(s.url),
    checked: day(s.checked),
    notes: list(s.notes, (n) => str(n, 600), 30),
    milestones: list(s.milestones, milestone),
    items: list(s.items, (i) => item(i)) ?? [],
    edited: bool(s.edited),
    custom: bool(s.custom),
    outdated: bool(s.outdated),
    v: str(s.v, 20),
  });
}

/** The whole saved state, with only well-formed values kept. */
export function sanitizeState(st) {
  const out = { ...st };
  out.subjects = list(st.subjects, sanitizeSubject, 40) ?? [];
  const known = new Set(out.subjects.map((s) => s.id));
  const grades = {};
  for (const [sid, g] of Object.entries(st.grades && typeof st.grades === 'object' ? st.grades : {})) {
    if (!known.has(sid) || !g || typeof g !== 'object') continue;
    grades[sid] = {};
    for (const [iid, e] of Object.entries(g)) {
      const v = num(e?.v, 0, 10);
      if (!id(iid) || v === undefined) continue;
      grades[sid][iid] = clean({ v, at: day(e.at), retake: bool(e.retake) });
    }
  }
  out.grades = grades;
  const done = {};
  for (const [sid, m] of Object.entries(st.done && typeof st.done === 'object' ? st.done : {})) {
    if (!known.has(sid) || !m || typeof m !== 'object') continue;
    done[sid] = Object.fromEntries(Object.entries(m).filter(([k, v]) => id(k) && day(v)));
  }
  out.done = done;
  const targets = {};
  for (const [sid, t] of Object.entries(st.targets && typeof st.targets === 'object' ? st.targets : {})) {
    const n = num(t, 0, 10);
    if (known.has(sid) && n !== undefined) targets[sid] = n;
  }
  out.targets = targets;
  out.seenNews = list(st.seenNews, id, 500) ?? [];
  out.catalogVersion = str(st.catalogVersion, 20);
  out.onboarded = st.onboarded === true;
  out.demo = st.demo === true;
  if (st.layout && typeof st.layout === 'object')
    out.layout = { preset: id(st.layout.preset) ?? 'custom', order: list(st.layout.order, id, 10) ?? [], hidden: list(st.layout.hidden, id, 10) ?? [] };
  else out.layout = null;
  return out;
}
