// Local-first state. Everything lives in this browser's localStorage.
import { CATALOG, catalogById, CATALOG_VERSION, blankSubject, COLORS } from './catalog.js';

const KEY = 'mai-grades:v1';
const clone = (x) => structuredClone(x);

const empty = () => ({
  version: 1,
  catalogVersion: CATALOG_VERSION,
  onboarded: false,
  subjects: [], // full subject structures, in display order
  grades: {}, // { [subjectId]: { [leafId]: { v, retake } } }
  targets: {}, // { [subjectId]: number }
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
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
  state.subjects = ids.map((id) => clone(catalogById[id])).filter(Boolean);
  state.onboarded = true;
  persist();
}

export function addFromCatalog(id) {
  if (getSubject(id) || !catalogById[id]) return;
  state.subjects.push(clone(catalogById[id]));
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
  const official = catalogById[id];
  if (!official) return;
  saveSubject(clone(official));
}

export function setGrade(subjectId, leafId, value, retake) {
  const g = (state.grades[subjectId] ||= {});
  if (value == null) {
    delete g[leafId];
  } else {
    g[leafId] = { v: value, ...(retake ? { retake: true } : {}) };
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
  state = { ...empty(), ...rest, onboarded: true };
  persist();
}

export function eraseAll() {
  state = empty();
  persist();
}

export const catalog = CATALOG;
