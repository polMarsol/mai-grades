import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, needed, parseGrade, flatten, datedItems } from '../assets/js/grades.js';
import { CATALOG, catalogById } from '../assets/js/catalog.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const g = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, { v }]));

const TESTS10 = Object.fromEntries(Array.from({ length: 10 }, (_, k) => [`iml-t${k + 1}`, 10]));

test('every catalog subject sums to 100% of the final mark', () => {
  for (const s of CATALOG) {
    const total = flatten(s.items).filter((n) => n.isLeaf).reduce((a, n) => a + n.frac, 0);
    near(total, 1);
  }
});

test('IML official formula', () => {
  const iml = catalogById.iml;
  const grades = g({
    'iml-w2-code': 8, 'iml-w2-report': 7, 'iml-w2-exam': 6,
    'iml-w3-code': 9, 'iml-w3-report': 8,
    ...TESTS10, 'iml-exam': 6,
  });
  const w2 = 0.35 * 8 + 0.35 * 7 + 0.3 * 6;
  const w3 = 0.5 * 9 + 0.5 * 8; // Work 3 exam replaced by an ungraded rubric
  const work = 0.4 * w2 + 0.4 * w3 + 0.2 * 10;
  const mark = 0.4 * 6 + 0.6 * work;
  const ev = evaluate(iml, grades);
  near(ev.secured, mark);
  near(ev.nodes['iml-work'].value, work);
  assert.equal(ev.status, 'passed');
});

test('IML exam below 3.5 fails the subject even with a good average', () => {
  const ev = evaluate(catalogById.iml, g({
    'iml-w2-code': 10, 'iml-w2-report': 10, 'iml-w2-exam': 10,
    'iml-w3-code': 10, 'iml-w3-report': 10,
    ...TESTS10, 'iml-exam': 3,
  }));
  assert.ok(ev.secured > 5);
  assert.equal(ev.status, 'failed');
});

test('needed grade honours the overall target', () => {
  const par = catalogById.par;
  const grades = g({ 'par-plan-prac': 8, 'par-plan-exam': 6 });
  const r = needed(par, grades, 7);
  // 0.25*8 + 0.30*6 = 3.8 ; need 3.2 from 0.45 -> 7.12
  assert.equal(r.kind, 'need');
  near(r.x, 7.12, 0.011);
});

test('needed grade honours a minimum when it is the binding constraint', () => {
  const iml = catalogById.iml;
  const grades = g({
    'iml-w2-code': 10, 'iml-w2-report': 10, 'iml-w2-exam': 10,
    'iml-w3-code': 10, 'iml-w3-report': 10, ...TESTS10,
  });
  const r = needed(iml, grades, 5);
  assert.equal(r.kind, 'need');
  near(r.x, 3.5, 0.011);
  assert.equal(r.binding.id, 'iml-exam');
});

test('impossible and secured targets', () => {
  const ci = catalogById.ci;
  assert.equal(needed(ci, g({ 'ci-ec': 0, 'ci-nc': 0, 'ci-fc': 0 }), 9).kind, 'impossible');
  assert.equal(needed(ci, g({ 'ci-ec': 10, 'ci-nc': 10, 'ci-fc': 10 }), 5).kind, 'secured');
});

test('resubmitted work is capped at 8', () => {
  const par = catalogById.par;
  const ev = evaluate(par, { 'par-plan-prac': { v: 10, retake: true } });
  near(ev.nodes['par-plan-prac'].value, 8);
});

test('simulation fills ungraded items without touching real grades', () => {
  const ci = catalogById.ci;
  const grades = g({ 'ci-ec': 8 });
  const ev = evaluate(ci, grades, { 'ci-nc': 6, 'ci-fc': 7, 'ci-exam': 5 });
  near(ev.projected, 0.5 * ((8 + 6 + 7) / 3) + 0.5 * 5);
  near(ev.secured, 0.5 * 8 / 3);
});

test('parseGrade accepts comma decimals and rejects junk', () => {
  assert.equal(parseGrade('7,5'), 7.5);
  assert.equal(parseGrade(''), null);
  assert.ok(Number.isNaN(parseGrade('11')));
  assert.ok(Number.isNaN(parseGrade('abc')));
});

test('ungraded milestones appear in deadlines with no weight', () => {
  const cv = catalogById.cv;
  const d = datedItems(cv);
  const topic = d.find((n) => n.item.id === 'cv-paper-topic');
  assert.ok(topic.isMilestone);
  assert.equal(topic.frac, 0);
  assert.deepEqual(d.map((n) => n.date), [...d.map((n) => n.date)].sort());
});

test('course updates: PAR planning exam on 18 Nov, IML Work 3 on 6 Dec', () => {
  assert.equal(flatten(catalogById.par.items).find((n) => n.item.id === 'par-plan-exam').item.date, '2026-11-18');
  assert.equal(flatten(catalogById.iml.items).find((n) => n.item.id === 'iml-w3-code').item.date, '2026-12-06');
  assert.equal(flatten(catalogById.iml.items).find((n) => n.item.id === 'iml-w3-exam'), undefined);
});

test('example grades and news point at real subjects and items', async () => {
  const { DEMO_GRADES, NEWS } = await import('../assets/js/catalog.js');
  const { findItem, itemPath } = await import('../assets/js/grades.js');
  for (const [sid, grades] of Object.entries(DEMO_GRADES)) {
    for (const lid of Object.keys(grades)) assert.ok(findItem(catalogById[sid].items, lid), `${sid}/${lid}`);
  }
  for (const n of NEWS) assert.ok(catalogById[n.subject], n.subject);
  assert.deepEqual(itemPath(catalogById.iml.items, 'iml-w2-code').slice(-2), ['Work 2: Lazy learning, SVM and RF', 'Code']);
});

test('news ids are unique and exam details sit only on exams', async () => {
  const { NEWS, CATALOG: C } = await import('../assets/js/catalog.js');
  const ids = NEWS.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(Boolean));
  for (const s of C) {
    for (const n of flatten(s.items)) {
      if (n.item.exam) assert.equal(n.item.kind, 'exam', n.item.id);
    }
  }
  const par = flatten(catalogById.par.items).find((n) => n.item.id === 'par-plan-exam').item;
  assert.match(par.exam.format, /10 true\/false/);
});

test('home layout presets only use known blocks and default to dates first', async () => {
  const { PRESETS, BLOCKS, getLayout } = await import('../assets/js/layout.js');
  const ids = BLOCKS.map((b) => b.id);
  for (const p of Object.values(PRESETS)) {
    assert.deepEqual([...p.order].sort(), [...ids].sort());
    for (const h of p.hidden) assert.ok(ids.includes(h) || h === 'progress');
  }
  const l = getLayout();
  assert.equal(l.preset, 'dates');
  assert.deepEqual(l.order, PRESETS.dates.order);
});

test('IML weekly questionnaires: ten dated Tuesdays worth 12% of the mark together', () => {
  const nodes = flatten(catalogById.iml.items);
  const tests = nodes.filter((n) => n.parent === 'iml-tests');
  assert.equal(tests.length, 10);
  near(tests.reduce((a, n) => a + n.frac, 0), 0.6 * 0.2);
  for (const n of tests) assert.equal(new Date(n.item.date + 'T12:00').getDay(), 2, n.item.id);
});

test('a grade on an item that became a group moves to its past parts', async () => {
  const { splitGrades } = await import('../assets/js/store.js');
  const grades = { 'iml-tests': { v: 8 } };
  splitGrades(grades, catalogById.iml.items, '2026-10-20');
  assert.equal(grades['iml-tests'], undefined);
  assert.deepEqual(Object.keys(grades).sort(), ['iml-t1', 'iml-t2', 'iml-t3', 'iml-t4']);
  near(evaluate(catalogById.iml, grades).nodes['iml-tests'].value, 8);
  const ihlt = { 'ihlt-sessions': { v: 9 } };
  splitGrades(ihlt, catalogById.ihlt.items, '2026-10-01');
  assert.deepEqual(ihlt, { 'ihlt-s1': { v: 9 } });
});

test('stats helpers: sample deviation, quantiles, means, regression and streaks', async () => {
  const S = await import('../assets/js/stats.js');
  near(S.sd([2, 4, 4, 4, 5, 5, 7, 9]), 2.138, 0.001);
  assert.equal(S.median([1, 3, 2]), 2);
  near(S.quantile([1, 2, 3, 4], 0.25), 1.75);
  near(S.geometricMean([2, 8]), 4);
  near(S.harmonicMean([2, 8]), 3.2);
  near(S.pearson([[1, 2], [2, 4], [3, 6]]), 1);
  const reg = S.regression([[0, 1], [1, 3], [2, 5]]);
  near(reg.b, 2);
  near(reg.r2, 1);
  assert.deepEqual(S.streaks([8, 9, 6, 7, 7.5, 10], 7), { best: 3, current: 3 });
  assert.equal(S.gpaPoints(9), 4);
  assert.equal(S.gpaPoints(4.9), 0);
});

test('stats: simulation is repeatable and a finished subject is certain', async () => {
  const S = await import('../assets/js/stats.js');
  const { DEMO_GRADES } = await import('../assets/js/catalog.js');
  const rows = S.collect(CATALOG.map((s) => ({ s, grades: DEMO_GRADES[s.id] || {}, target: 5 })));
  const a = S.simulate(rows, { runs: 200, seed: 42 });
  const b = S.simulate(rows, { runs: 200, seed: 42 });
  assert.deepEqual(a.semester, b.semester);
  for (const o of a.subjects) if (o.finals) assert.ok(o.pass >= 0 && o.pass <= 1);
  const ci = catalogById.ci;
  const done = S.collect([{ s: ci, grades: { 'ci-ec': { v: 8 }, 'ci-nc': { v: 8 }, 'ci-fc': { v: 8 }, 'ci-exam': { v: 6 } }, target: 7 }]);
  const sim = S.simulate(done, { runs: 50, seed: 1 });
  assert.equal(sim.subjects[0].pass, 1);
  assert.equal(sim.subjects[0].hit, 1);
  // one point on an exam worth half of a 5-ECTS subject, out of 5 ECTS in total
  const gain = S.sensitivity(S.collect([{ s: ci, grades: {}, target: 5 }]));
  near(gain.find((g) => g.item.id === 'ci-exam').semesterGain, 0.5);
});
