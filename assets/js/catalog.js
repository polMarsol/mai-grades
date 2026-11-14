// Official evaluation structures, MAI 2026–27, first semester.
// Weights are relative to their siblings. Dates are delivery or exam days.
// Where a guide does not publish a weight, siblings are split equally and the
// assumption is listed in `notes` so students can adjust it in the editor.
// `milestones` are dates that matter but carry no grade (topic choice, rubrics…).

export const CATALOG_VERSION = '2026-27.4';

// Day the structures below were last checked against the course guides and announcements.
export const CHECKED = '2026-11-14';

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
    source: 'T0 Overview IML 26-27 (v3), updated with the Work 3 announcement',
    notes: [
      'Work 1 is mandatory but does not count towards the mark.',
      'Work 3 has no exam: after submitting you fill in an ungraded contribution rubric and an integrity declaration. Large discrepancies can lead to an extra exam.',
      'With the Work 3 exam removed, code and report are weighted equally here until the new split is published.',
      'Late deliveries lose 1 point per day.',
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
          { id: 'iml-tests', name: 'Weekly theory questionnaires', weight: 20, kind: 'test' },
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
    source: 'IHLT 01 Introduction and Lab 1 Framework',
    notes: ['The final exam is in the January exam period; add the date once it is published.'],
    items: [
      {
        id: 'ihlt-lab',
        name: 'Lab',
        weight: 50,
        children: [
          { id: 'ihlt-sessions', name: 'Lab session exercises', weight: 10 },
          { id: 'ihlt-sts', name: 'STS project', weight: 30 },
          { id: 'ihlt-questions', name: 'Questions to other groups', weight: 10 },
        ],
      },
      { id: 'ihlt-exam', name: 'Final exam', weight: 50, kind: 'exam' },
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
    notes: ['The guide does not split the three projects; they are weighted equally here.'],
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
      'Lab and presentation weights inside the practicum are not published; they are equal here.',
      'If you fail the first midterm, the second exam covers the whole course.',
    ],
    items: [
      {
        id: 'cv-practicum',
        name: 'Practicum',
        weight: 50,
        min: 5,
        children: [
          { id: 'cv-lab1', name: 'Lab 1', weight: 1 },
          { id: 'cv-lab2', name: 'Lab 2', weight: 1 },
          { id: 'cv-lab3', name: 'Lab 3', weight: 1 },
          { id: 'cv-lab4', name: 'Lab 4', weight: 1 },
          { id: 'cv-lab5', name: 'Lab 5', weight: 1 },
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
    rule: 'Theory and practical parts must each reach 5.',
    source: 'MAS Work Plan 2026-27',
    notes: ['Practical work not accepted on time can be resubmitted on 24 January with a maximum of 8.'],
    items: [
      {
        id: 'imas-practical',
        name: 'Practical work',
        weight: 60,
        min: 5,
        children: [
          { id: 'imas-task1', name: 'Task 1', weight: 15, date: '2026-11-22', retake: 8 },
          { id: 'imas-prelim', name: 'Implementation preliminary revision', weight: 5, date: '2026-12-13', retake: 8 },
          { id: 'imas-final', name: 'Practical work final delivery', weight: 35, date: '2027-01-10', retake: 8 },
          { id: 'imas-team', name: 'Teamwork during the semester', weight: 5 },
        ],
      },
      { id: 'imas-exam', name: 'Theoretical exam', weight: 40, min: 5, date: '2027-01-13', kind: 'exam' },
    ],
  },
  {
    id: 'par',
    code: 'PAR',
    name: 'Planning and Approximate Reasoning',
    university: 'URV',
    ects: 5,
    color: 'magenta',
    rule: 'Both theory exams must reach 5 and practical work must be accepted.',
    source: 'PAR Evaluation Guide 2026-27, updated with the News Forum (10 Nov)',
    notes: [
      'Planning exam moved to Wednesday 18 November, 11:00–13:00, rooms A215 and A207 (building E1): 10 true/false and 10 multiple-choice questions.',
      'Practical work not accepted on time can be resubmitted on 17 January with a maximum of 8.',
    ],
    items: [
      { id: 'par-plan-prac', name: 'Planning practical exercise', weight: 25, date: '2026-11-06', retake: 8 },
      { id: 'par-plan-exam', name: 'Planning theory exam', weight: 30, min: 5, date: '2026-11-18', time: '11:00–13:00', place: 'Rooms A215 and A207, building E1', kind: 'exam' },
      { id: 'par-ar-prac', name: 'Approximate Reasoning practical exercise', weight: 15, date: '2026-12-14', retake: 8 },
      { id: 'par-ar-exam', name: 'Approximate Reasoning theory exam', weight: 30, min: 5, date: '2027-01-13', kind: 'exam' },
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
export const NEWS = [
  {
    date: '2026-11-14',
    subject: 'iml',
    title: 'Work 3 is now due on 6 December',
    detail: 'The Work 3 exam is replaced by an ungraded contribution rubric.',
  },
  {
    date: '2026-11-14',
    subject: 'par',
    title: 'Planning exam moved to Wednesday 18 November',
    detail: '11:00–13:00, rooms A215 and A207 (building E1). 10 true/false and 10 multiple-choice questions.',
  },
  {
    date: '2026-11-14',
    subject: 'cv',
    title: 'Paper presentation dates',
    detail: 'Article and group by 16 November; slides and critical discussion by 13 December.',
  },
];

// Made-up grades for the "See an example" mode.
export const DEMO_GRADES = {
  iml: { 'iml-w2-code': { v: 8.5 }, 'iml-w2-report': { v: 7.8 }, 'iml-w2-exam': { v: 6.4 }, 'iml-tests': { v: 9 } },
  ihlt: { 'ihlt-sessions': { v: 9 } },
  ci: { 'ci-ec': { v: 8.2 } },
  cv: { 'cv-lab1': { v: 9 }, 'cv-lab2': { v: 8.5 }, 'cv-mid1': { v: 4.6 } },
  par: { 'par-plan-prac': { v: 7.5 } },
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
