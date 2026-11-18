// Local-first state. Everything lives in this browser's localStorage.
import { CATALOG, catalogById, CATALOG_VERSION, blankSubject, COLORS, DEMO_GRADES, DEMO_DONE, NEWS } from './catalog.js';

const KEY = 'mai-grades:v1';
const clone = (x) => structuredClone(x);
const official = (id) => ({ ...clone(catalogById[id]), v: CATALOG_VERSION });
let migrated = [];

const empty = () => ({
  version: 1,
  catalogVersion: CATALOG_VERSION,
  onboarded: false,
  subjects: [], // full subject structures, in display order
  grades: {}, // { [subjectId]: { [leafId]: { v, retake } } }
  targets: {}, // { [subjectId]: number }
  done: {}, // { [subjectId]: { [itemId]: 'YYYY-MM-DD' } } submitted or taken, grade or not
  seenNews: [], // ids of course news already shown on the home screen
  layout: null, // Home layout: { preset, order, hidden }; null = default
});

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    // Saved before news had ids: everything published so far was already on screen.
    if (!Array.isArray(parsed.seenNews)) parsed.seenNews = parsed.onboarded ? NEWS.map((n) => n.id) : [];
    return migrate({ ...empty(), ...parsed });
  } catch {
    return empty();
  }
}

/**
 * When the course guides change, refresh subjects the student never edited.
 * Edited subjects keep their structure and are flagged so the app can offer a restore.
 */
function migrate(st) {
  if (st.catalogVersion === CATALOG_VERSION) return st;
  st.subjects = st.subjects.map((s) => {
    if (!catalogById[s.id] || s.v === CATALOG_VERSION) return s;
    if (!s.edited) {
      const next = official(s.id);
      const shape = (x) => JSON.stringify([x.items, x.milestones || []]);
      if (shape(next) !== shape(s)) migrated.push(s.code);
      splitGrades(st.grades?.[s.id], next.items);
      return { ...next, color: s.color };
    }
    return { ...s, outdated: true };
  });
  st.catalogVersion = CATALOG_VERSION;
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    /* ignore */
  }
  return st;
}

/**
 * A graded item that has become a group (say, "Weekly questionnaires" now split into T1…T10)
 * hands its grade to the parts already past, or to the first part when none has a date yet.
 * That keeps the subject's grade where it was; the student can then fill in each part.
 */
export function splitGrades(grades, items, today = new Date().toISOString().slice(0, 10)) {
  if (!grades) return;
  const walk = (list) => {
    for (const it of list) {
      if (!it.children?.length) continue;
      const old = grades[it.id];
      if (old && old.v != null) {
        const kids = it.children.filter((c) => !c.children?.length);
        const past = kids.filter((c) => c.date && c.date <= today);
        for (const c of past.length ? past : kids.slice(0, 1)) grades[c.id] ??= { ...old };
        delete grades[it.id];
      }
      walk(it.children);
    }
  };
  walk(items);
}

/** Codes of subjects refreshed from the course guides on this load (returned once). */
export function takeMigrationNotice() {
  const m = migrated;
  migrated = [];
  return m;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
  listeners.forEach((fn) => fn(state));
}

export const getState = () => state;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const getSubject = (id) => state.subjects.find((s) => s.id === id);
export const getGrades = (id) => state.grades[id] || {};
export const getTarget = (id) => state.targets[id] ?? 5;

export function startWith(ids) {
  state.subjects = ids.filter((id) => catalogById[id]).map(official);
  state.onboarded = true;
  state.seenNews = NEWS.map((n) => n.id);
  persist();
}

/** Load every subject with made-up grades so people can look around before typing anything. */
export function loadDemo() {
  state = { ...empty(), onboarded: true, demo: true, subjects: CATALOG.map((s) => official(s.id)), grades: clone(DEMO_GRADES), done: clone(DEMO_DONE), seenNews: NEWS.map((n) => n.id), layout: state.layout };
  persist();
}

export function addFromCatalog(id) {
  if (getSubject(id) || !catalogById[id]) return;
  state.subjects.push(official(id));
  state.onboarded = true;
  persist();
}

export function createCustom() {
  const id = `c${Date.now().toString(36)}`;
  const used = new Set(state.subjects.map((s) => s.color));
  const color = COLORS.find((c) => !used.has(c)) || COLORS[state.subjects.length % COLORS.length];
  const s = blankSubject(id, color);
  state.subjects.push(s);
  state.onboarded = true;
  persist();
  return s;
}

export function removeSubject(id) {
  state.subjects = state.subjects.filter((s) => s.id !== id);
  delete state.grades[id];
  delete state.targets[id];
  if (state.done) delete state.done[id];
  persist();
}

export function moveSubject(id, dir) {
  const i = state.subjects.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= state.subjects.length) return;
  const [s] = state.subjects.splice(i, 1);
  state.subjects.splice(j, 0, s);
  persist();
}

export function saveSubject(subject) {
  const i = state.subjects.findIndex((s) => s.id === subject.id);
  if (i < 0) state.subjects.push(subject);
  else state.subjects[i] = subject;
  persist();
}

export function resetStructure(id) {
  if (!catalogById[id]) return;
  const current = getSubject(id);
  saveSubject({ ...official(id), color: current?.color ?? catalogById[id].color });
}

export function setGrade(subjectId, leafId, value, retake) {
  const g = (state.grades[subjectId] ||= {});
  if (value == null) {
    delete g[leafId];
  } else {
    // `at`: the day the grade was typed, used to place undated grades on the Stats timeline
    const at = g[leafId]?.v === value && g[leafId]?.at ? g[leafId].at : new Date().toISOString().slice(0, 10);
    g[leafId] = { v: value, at, ...(retake ? { retake: true } : {}) };
  }
  persist();
}

export function setRetake(subjectId, leafId, retake) {
  const g = (state.grades[subjectId] ||= {});
  if (!g[leafId]) return;
  if (retake) g[leafId].retake = true;
  else delete g[leafId].retake;
  persist();
}

export const isDone = (subjectId, itemId) => !!state.done?.[subjectId]?.[itemId];
export const doneOn = (subjectId, itemId) => state.done?.[subjectId]?.[itemId] || null;

export function setDone(subjectId, itemId, on) {
  const d = (state.done ||= {});
  const m = (d[subjectId] ||= {});
  if (on) m[itemId] = todayIso();
  else delete m[itemId];
  persist();
}

/** Course news for the student's subjects that the home screen hasn't shown yet. */
export function unseenNews() {
  const mine = new Set(state.subjects.map((s) => s.id));
  const seen = new Set(state.seenNews || []);
  return NEWS.filter((n) => mine.has(n.subject) && !seen.has(n.id));
}

export function markNewsSeen() {
  const ids = unseenNews().map((n) => n.id);
  if (!ids.length) return;
  state.seenNews = [...(state.seenNews || []), ...ids];
  persist();
}

export function setLayout(layout) {
  state.layout = layout;
  persist();
}

export function setTarget(subjectId, t) {
  state.targets[subjectId] = t;
  persist();
}

export function exportData() {
  return JSON.stringify({ app: 'mai-grades', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importData(text) {
  const data = JSON.parse(text);
  if (data.app !== 'mai-grades' || !Array.isArray(data.subjects)) {
    throw new Error('This file is not a MAI Grades backup.');
  }
  const { app, exportedAt, ...rest } = data;
  state = migrate({ ...empty(), ...rest, onboarded: true });
  persist();
}

export function eraseAll() {
  state = empty();
  persist();
}

export const catalog = CATALOG;
