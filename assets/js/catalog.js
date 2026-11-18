// Official evaluation structures, MAI 2026–27, first semester.
// Weights are relative to their siblings. Dates are delivery or exam days.
// Where a guide does not publish a weight, siblings are split equally and the
// assumption is listed in `notes` so students can adjust it in the editor.
// `milestones` are dates that matter but carry no grade (topic choice, rubrics…).

export const CATALOG_VERSION = '2026-27.8';

// Day the structures below were last checked against the course guides and announcements.
export const CHECKED = '2026-11-18';

export const COLORS = ['blue', 'orange', 'aqua', 'violet', 'magenta', 'green', 'yellow', 'red'];

export const CATALOG = [
  {
    id: 'iml',
    code: 'IML',
    name: 'Introduction to Machine Learning',
    university: 'UB',
    ects: 5,
    color: 'blue',
    rule: 'Mark = 0.4 × Exam + 0.6 × Work, if Exam ≥ 3.5 and Work ≥ 4.5.',
    source: 'T0 Overview IML 26-27 (v3) and its calendar, updated with the Work 3 announcement',
    notes: [
      'Work 1 is mandatory but does not count towards the mark.',
      'Work 3 has no exam: after submitting you fill in an ungraded contribution rubric and an integrity declaration. Large discrepancies can lead to an extra exam.',
      'With the Work 3 exam removed, code and report are weighted equally here until the new split is published.',
      'Late deliveries lose 1 point per day.',
      'Weekly questionnaires are done in the Tuesday class, on the theory block of the week before (T1 and T2 together on 6 October). The guide does not weight them, so they count equally here. T12 has no questionnaire in the calendar.',
      'After each Work delivery there is an individual questionnaire that weights the group mark for each member.',
    ],
    milestones: [{ id: 'iml-w3-rubric', name: 'Work 3 contribution rubric (not graded)', date: '2026-12-06' }],
    items: [
      {
        id: 'iml-work',
        name: 'Work',
        weight: 60,
        min: 4.5,
        children: [
          {
            id: 'iml-w2',
            name: 'Work 2: Lazy learning, SVM and RF',
            weight: 40,
            children: [
              { id: 'iml-w2-code', name: 'Code', weight: 35, date: '2026-10-20' },
              { id: 'iml-w2-report', name: 'Report', weight: 35, date: '2026-10-20' },
              { id: 'iml-w2-exam', name: 'Work 2 exam', weight: 30, date: '2026-10-27', kind: 'exam' },
            ],
          },
          {
            id: 'iml-w3',
            name: 'Work 3: Clustering, factor analysis and visualisation',
            weight: 40,
            children: [
              { id: 'iml-w3-code', name: 'Code', weight: 50, date: '2026-12-06' },
              { id: 'iml-w3-report', name: 'Report', weight: 50, date: '2026-12-06' },
            ],
          },
          {
            id: 'iml-tests',
            name: 'Weekly theory questionnaires',
            weight: 20,
            children: [
              { id: 'iml-t1', name: 'T1: Introduction to ML', weight: 1, date: '2026-10-06', kind: 'test' },
              { id: 'iml-t2', name: 'T2: Introduction to supervised learning', weight: 1, date: '2026-10-06', kind: 'test' },
              { id: 'iml-t3', name: 'T3: Lazy learning', weight: 1, date: '2026-10-13', kind: 'test' },
              { id: 'iml-t4', name: 'T4: Model selection', weight: 1, date: '2026-10-20', kind: 'test' },
              { id: 'iml-t5', name: 'T5: SVM and kernels', weight: 1, date: '2026-10-27', kind: 'test' },
              { id: 'iml-t6', name: 'T6: Feature selection', weight: 1, date: '2026-11-03', kind: 'test' },
              { id: 'iml-t7', name: 'T7: Clustering, part 1', weight: 1, date: '2026-11-10', kind: 'test' },
              { id: 'iml-t8', name: 'T8: Clustering, part 2', weight: 1, date: '2026-11-17', kind: 'test' },
              { id: 'iml-t9', name: 'T9: Factor analysis: PCA and ICA', weight: 1, date: '2026-11-24', kind: 'test' },
              { id: 'iml-t10', name: 'T10: Visualisation: SOM and MDS', weight: 1, date: '2026-12-01', kind: 'test' },
            ],
          },
        ],
      },
      { id: 'iml-exam', name: 'Final exam', weight: 40, min: 3.5, date: '2026-12-15', kind: 'exam' },
    ],
  },
  {
    id: 'ihlt',
    code: 'IHLT',
    name: 'Introduction to Human Language Technologies',
    university: 'UPC',
    ects: 5,
    color: 'aqua',
    rule: 'Final = 50% Exam + 50% Lab. Lab = 0.1 Sessions + 0.3 Project + 0.1 Questions.',
    source: 'IHLT 01 Introduction, Lab 1 Framework and the IHLT-MAI 2026 schedule',
    url: 'https://www.cs.upc.edu/~turmo/ihlt/plan32j/IHLT.html',
    notes: [
      'Theory: Jordi Turmo (coordinator). Labs: Lluís Padró.',
      'Lab session exercises: nine short deliverables, in pairs, uploaded to Racó, each due the week after its session. Together they are 1 point of the final mark, so each counts the same here.',
      'STS project: delivery on 10 December, presentations in person on 10 and 17 December. Word and sentence embeddings are not allowed.',
    ],
    milestones: [
      { id: 'ihlt-pres-1', name: 'Project presentations, first day', date: '2026-12-10' },
      { id: 'ihlt-pres-2', name: 'Project presentations, second day', date: '2026-12-17' },
    ],
    items: [
      {
        id: 'ihlt-lab',
        name: 'Lab',
        weight: 50,
        children: [
          {
            id: 'ihlt-sessions',
            name: 'Lab session exercises',
            weight: 10,
            children: [
              { id: 'ihlt-s1', name: 'Lab 1: Framework', weight: 1, date: '2026-09-30' },
              { id: 'ihlt-s2', name: 'Lab 2', weight: 1, date: '2026-10-08' },
              { id: 'ihlt-s3', name: 'Lab 3', weight: 1, date: '2026-10-15' },
              { id: 'ihlt-s4', name: 'Lab 4', weight: 1, date: '2026-10-22' },
              { id: 'ihlt-s5', name: 'Lab 5', weight: 1, date: '2026-10-29' },
              { id: 'ihlt-s6', name: 'Lab 6', weight: 1, date: '2026-11-05' },
              { id: 'ihlt-s7', name: 'Lab 7', weight: 1, date: '2026-11-12' },
              { id: 'ihlt-s8', name: 'Lab 8', weight: 1, date: '2026-11-26' },
              { id: 'ihlt-s9', name: 'Lab 9', weight: 1, date: '2026-12-03' },
            ],
          },
          { id: 'ihlt-sts', name: 'STS project', weight: 30, date: '2026-12-10' },
          { id: 'ihlt-questions', name: 'Questions to other groups', weight: 10 },
        ],
      },
      { id: 'ihlt-exam', name: 'Final exam', weight: 50, date: '2027-01-14', kind: 'exam' },
    ],
  },
  {
    id: 'ci',
    code: 'CI',
    name: 'Computational Intelligence',
    university: 'UPC',
    ects: 5,
    color: 'violet',
    rule: 'Final = 50% Projects + 50% Exam.',
    source: 'CI Class Index 2026-27',
    notes: [
      'The guide does not split the three projects; they are weighted equally here.',
      'Projects are done in pairs. Theory in room A6002, labs in C6S308 and C6S309.',
    ],
    milestones: [
      { id: 'ci-nc-start', name: 'Neural Computation project starts', date: '2026-11-26' },
      { id: 'ci-fc-start', name: 'Fuzzy Computation project starts', date: '2026-12-17' },
    ],
    items: [
      {
        id: 'ci-projects',
        name: 'Projects',
        weight: 50,
        children: [
          { id: 'ci-ec', name: 'Evolutionary Computation project', weight: 1, date: '2026-11-12' },
          { id: 'ci-nc', name: 'Neural Computation project', weight: 1, date: '2026-12-17' },
          { id: 'ci-fc', name: 'Fuzzy Computation project', weight: 1, date: '2027-01-13' },
        ],
      },
      { id: 'ci-exam', name: 'Exam', weight: 50, date: '2027-01-07', kind: 'exam' },
    ],
  },
  {
    id: 'cv',
    code: 'CV',
    name: 'Computational Vision',
    university: 'UB',
    ects: 5,
    color: 'orange',
    rule: 'Final = 50% Practicum + 50% Theory. Both parts must be passed.',
    milestones: [
      { id: 'cv-paper-topic', name: 'Paper presentation: article and group', date: '2026-11-16', time: 'by 23:00' },
      { id: 'cv-paper-slides', name: 'Paper presentation: slides and critical discussion', date: '2026-12-13', time: 'by 23:00' },
    ],
    source: 'CV 2026-27 Course Presentation and Campus Virtual',
    notes: [
      'Paper presentation: 13 minutes per group; submit the slides (course template) and a critical discussion of up to 2 pages.',
      'Five lab evaluations, done in person in the lab roughly every two weeks (on Campus Virtual they appear as “Evaluation on Sets …”). Lab and presentation weights inside the practicum are not published; they are equal here.',
      'The midterm has a test part worth 5 points and a second part; enter the overall grade.',
      'If you fail the first midterm, the second exam covers the whole course.',
    ],
    items: [
      {
        id: 'cv-practicum',
        name: 'Practicum',
        weight: 50,
        min: 5,
        children: [
          { id: 'cv-lab1', name: 'Lab evaluation 1', weight: 1, date: '2026-10-20' },
          { id: 'cv-lab2', name: 'Lab evaluation 2', weight: 1, date: '2026-11-03' },
          { id: 'cv-lab3', name: 'Lab evaluation 3', weight: 1, date: '2026-11-10' },
          { id: 'cv-lab4', name: 'Lab evaluation 4', weight: 1, date: '2026-12-01' },
          { id: 'cv-lab5', name: 'Lab evaluation 5', weight: 1, date: '2026-11-24' },
          { id: 'cv-paper', name: 'Paper presentation', weight: 1, date: '2026-12-15', time: '15:30–18:30' },
        ],
      },
      {
        id: 'cv-theory',
        name: 'Theory',
        weight: 50,
        min: 5,
        children: [
          { id: 'cv-mid1', name: 'Midterm exam', weight: 1, date: '2026-11-03', kind: 'exam' },
          { id: 'cv-mid2', name: 'Final exam', weight: 1, date: '2026-12-15', kind: 'exam' },
        ],
      },
    ],
  },
  {
    id: 'imas',
    code: 'IMAS',
    name: 'Introduction to Multi-Agent Systems',
    university: 'URV',
    ects: 5,
    color: 'green',
    rule: 'Final = 60% Practical work + 40% Theory exam. Each part must reach 5.',
    source: 'MAS Work Plan 2026-27 and Campus Virtual (18 Nov)',
    url: 'https://campusvirtual.urv.cat/',
    notes: [
      'Lecturer: Dr. Jordi Pascual Fontanilles.',
      'Task 2: the work plan says deliver on 13 December and discuss it in class on 16 December; Campus Virtual accepts it until 16 December at 23:55.',
      'Second call on 24 January, with a maximum of 8 for practical work. MAI grades close on 23 January, so it is only open to MESIIA students.',
    ],
    milestones: [
      {
        id: 'imas-slot',
        name: 'Choose your Task 1 presentation slot',
        date: '2026-11-22',
        time: 'by 23:55',
        url: 'https://campusvirtual.urv.cat/mod/choice/view.php?id=4372690',
      },
      { id: 'imas-task1-talks', name: 'Task 1 presentations, week of 25 November', date: '2026-11-25' },
    ],
    items: [
      {
        id: 'imas-practical',
        name: 'Practical work',
        weight: 60,
        min: 5,
        children: [
          {
            id: 'imas-task1',
            name: 'Task 1: Design activity',
            weight: 15,
            date: '2026-11-22',
            time: 'by 23:55',
            url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4372679',
          },
          {
            id: 'imas-prelim',
            name: 'Task 2: Coordination and implementation preliminary revision',
            weight: 5,
            date: '2026-12-16',
            time: 'by 23:55',
            url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4372680',
          },
          {
            id: 'imas-final',
            name: 'Final documentation and implementation',
            weight: 35,
            date: '2027-01-10',
            time: 'by 23:55',
            url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4372681',
          },
          { id: 'imas-team', name: 'Teamwork during the semester', weight: 5 },
        ],
      },
      { id: 'imas-exam', name: 'Theory exam', weight: 40, min: 5, date: '2027-01-13', kind: 'exam' },
    ],
  },
  {
    id: 'par',
    code: 'PAR',
    name: 'Planning and Approximate Reasoning',
    university: 'URV',
    ects: 5,
    color: 'magenta',
    rule: 'Both theory exams must reach 5 and both practical exercises must be accepted.',
    source: 'PAR Evaluation Guide 2026-27, News Forum (10 Nov) and Campus Virtual (18 Nov)',
    notes: [
      'Planning exam moved to Wednesday 18 November, 11:00–13:00, rooms A215 and A207 (building E1): 10 true/false and 10 multiple-choice questions.',
      'Second call for the practical exercises: resubmit by 17 January at 23:59, with a maximum of 8.',
      'The exam retake on 25 January is only for MESIIA students; MAI grades close before it.',
    ],
    items: [
      {
        id: 'par-plan-prac',
        name: 'Assignment #1: Planning',
        weight: 25,
        date: '2026-11-06',
        time: 'by 23:59',
        retake: 8,
        url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4416197',
      },
      {
        id: 'par-plan-exam',
        name: 'Exam: Planning',
        weight: 30,
        url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4416199',
        min: 5,
        date: '2026-11-18',
        time: '11:00–13:00',
        place: 'Rooms A215 and A207, building E1',
        kind: 'exam',
        exam: {
          duration: '2 hours',
          format: '10 true/false and 10 multiple-choice questions',
          prep: [
            'A preparation guide and a practice quiz are in “Information about the exam” on the course page. The quiz has 60 questions on Lectures 1–5 and three Graphplan problems, and is not graded.',
            'Questions are welcome in the Doubts Forum.',
            'In the afternoon, the lab sessions are for questions about the practical work and the LLM lab: G1 16:00–17:00 in Lab 209, G2 17:00–18:00 in Lab 208.',
          ],
          source: 'PAR News Forum, 10 November',
        },
      },
      {
        id: 'par-ar-prac',
        name: 'Assignment #2: Fuzzy expert system',
        weight: 15,
        date: '2026-12-14',
        time: 'by 23:59',
        retake: 8,
        url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4416201',
      },
      {
        id: 'par-ar-exam',
        name: 'Exam: Approximate Reasoning',
        weight: 30,
        min: 5,
        date: '2027-01-13',
        time: '11:00',
        kind: 'exam',
        url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4416202',
      },
    ],
  },
];

// Where each university hosts its courses. A subject or item can carry its own `url`
// (the course page or the task itself); otherwise the campus home page is used.
export const CAMPUS = {
  UB: 'https://campusvirtual.ub.edu/',
  UPC: 'https://atenea.upc.edu/',
  URV: 'https://campusvirtual.urv.cat/',
};
for (const s of CATALOG) {
  s.checked = CHECKED;
  s.url ??= CAMPUS[s.university];
}

export const catalogById = Object.fromEntries(CATALOG.map((s) => [s.id, s]));

// Changes announced during the course, newest first. `date` is the day the app was updated.
// Give every item a unique `id`: the app uses it to mark news as new until it has been seen.
// Course and app news live in news.js.
export { NEWS } from './news.js';

// Made-up grades for the "See an example" mode.
export const DEMO_GRADES = {
  iml: {
    'iml-w2-code': { v: 8.5 }, 'iml-w2-report': { v: 7.8 }, 'iml-w2-exam': { v: 6.4 },
    'iml-t1': { v: 9 }, 'iml-t2': { v: 8 }, 'iml-t3': { v: 10 }, 'iml-t4': { v: 7.5 },
    'iml-t5': { v: 8.5 }, 'iml-t6': { v: 6 }, 'iml-t7': { v: 9 }, 'iml-t8': { v: 8 },
  },
  ihlt: {
    'ihlt-s1': { v: 8.2 }, 'ihlt-s2': { v: 9 }, 'ihlt-s3': { v: 7.5 }, 'ihlt-s4': { v: 10 },
    'ihlt-s5': { v: 8 }, 'ihlt-s6': { v: 9.5 }, 'ihlt-s7': { v: 8 },
  },
  ci: { 'ci-ec': { v: 8.2 } },
  cv: { 'cv-lab1': { v: 9 }, 'cv-lab2': { v: 8.5 }, 'cv-lab3': { v: 9.5 }, 'cv-mid1': { v: 4.6 } },
  par: { 'par-plan-prac': { v: 7.5 }, 'par-plan-exam': { v: 6.8 } },
};

// Items marked as submitted in the example (submitted, no grade yet).
export const DEMO_DONE = {
  ihlt: { 'ihlt-s8': '2026-11-17' },
};

/** Starting structure for a subject the student creates themselves. */
export function blankSubject(id, color) {
  return {
    id,
    code: 'NEW',
    name: 'New subject',
    university: '',
    ects: 5,
    color,
    custom: true,
    rule: '',
    notes: [],
    items: [
      { id: `${id}-practical`, name: 'Practical work', weight: 50 },
      { id: `${id}-exam`, name: 'Final exam', weight: 50, kind: 'exam' },
    ],
  };
}
