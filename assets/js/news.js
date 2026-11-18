// News: what changed in the courses, and what is new in the app.
//
// To publish a story, add an object at the top of the list and push. Fields:
//   id       unique, never reused (it remembers who has read it)
//   date     'YYYY-MM-DD', the day of the news
//   kind     'course' for a subject, 'app' for MAI Grades itself
//   subject  the subject id ('iml', 'par', ...) for course news
//   title    the headline, one line
//   dek      the subtitle: one or two sentences with the essential
//   body     paragraphs; **bold** and [links](https://...) work
//   changes  optional before and after: [{ what, before, after }] (before can be left out)
//   links    optional buttons: [{ label, url }]
//   image    optional photo: { src: 'assets/news/file.jpg', alt: 'What it shows' }
//            Without one, the cover is drawn in the subject's colour.
//   art      for app news without a photo, a drawing for the cover: 'calendar', 'stats' or 'update'

export const NEWS = [
  {
    id: 'cv-lab5-date',
    date: '2026-11-18',
    kind: 'course',
    subject: 'cv',
    title: 'CV Lab evaluation 5 is on 24 November',
    dek: 'The last in-person lab evaluation now has its date: next Tuesday.',
    body: [
      'The fifth lab evaluation of Computer Vision is on **Tuesday 24 November**, in person in the lab, like the others.',
      'The five lab evaluations and the paper presentation make up the practicum, half of the final mark, and the practicum needs at least a 5.',
    ],
    changes: [{ what: 'Lab evaluation 5', before: 'No date', after: 'Tue 24 Nov' }],
  },
  {
    id: 'app-calendar-feed',
    date: '2026-11-18',
    kind: 'app',
    art: 'calendar',
    title: 'Your calendar now follows every change',
    dek: 'Subscribe once in Google, Apple or Outlook. When a date moves here, it moves in your calendar too.',
    body: [
      'Until now, “Add to calendar” gave you a file: a copy of the dates on the day you downloaded it. If an exam moved afterwards, your calendar never knew.',
      'Now you can **subscribe** instead. Open Overview, tap **Add to calendar** and pick Google Calendar, Apple Calendar or copy the link for Outlook. Choose all six subjects in one calendar, or one calendar per subject.',
      'Each event links to the task on Campus Virtual and to your grades here, and comes with a reminder the day before. Google checks for changes every few hours, so a moved date can take up to a day to show there.',
      'The subscription has the official dates from the course guides. If you changed a date yourself, the downloaded file still includes your own edits.',
    ],
  },
  {
    id: 'app-stay-current',
    date: '2026-11-18',
    kind: 'app',
    art: 'update',
    title: 'New dates reach you as soon as they are out',
    dek: 'A bar tells you when a new version is ready, your grades are better protected, and reporting a wrong date takes one tap.',
    body: [
      'MAI Grades works offline, so your phone keeps a copy of it. That copy could hide a date that had just changed. Now, when a new version is published, a bar appears at the bottom: tap **Reload** and you have it.',
      'Your grades live only on your device. On iPhone, Safari can clear a website’s data after a week without visits, so the app now suggests adding it to your Home Screen, where that does not happen. Everyone gets a reminder to save a backup file after five new grades.',
      'Every subject now ends with **Report it on GitHub**: a form already filled in with the subject, where you only say what is wrong and where it comes from. If you prefer email, the address is on the About page.',
    ],
  },
  {
    id: 'app-stats',
    date: '2026-11-18',
    kind: 'app',
    art: 'stats',
    title: 'Stats: your grades from every angle',
    dek: 'A timeline of every grade, your ECTS-weighted average, the spread of each subject and your chance of passing, simulated a thousand times.',
    body: [
      'The new Stats tab turns the grades you type into charts. Every grade sits on a timeline, sized by how much it weighs in your semester, with your ECTS-weighted average drawn through it.',
      'For each subject you get the mean, the standard deviation and a box plot, how many of its 10 points are already decided, and how far you are from your target.',
      'The **chance of passing** comes from a Monte Carlo simulation: your missing grades are drawn at random, following the grades you already have, a thousand times over. It also tells you where one more point would raise your average the most.',
      'And for the nerds: median, geometric and harmonic means, skewness, the trend of your grades over time and how your practicals and exams correlate. Everything is worked out on your device.',
    ],
  },
  {
    id: 'ihlt-schedule',
    date: '2026-11-18',
    kind: 'course',
    subject: 'ihlt',
    title: 'Every IHLT lab delivery now has a date',
    dek: 'The course schedule sets a deadline for each of the nine lab exercises, the STS project and the final exam.',
    body: [
      'Each lab exercise is due about a week after its session, uploaded to Racó in pairs. The next ones are **Lab 8 on 26 November** and **Lab 9 on 3 December**. Together the nine are worth 1 point of the final mark.',
      'The STS project is delivered on **10 December**, with presentations in person on 10 and 17 December. Word and sentence embeddings are not allowed.',
      'The final exam is on **Thursday 14 January**.',
    ],
    changes: [
      { what: 'Final exam', before: 'No date', after: 'Thu 14 Jan' },
      { what: 'STS project', before: 'No date', after: 'Thu 10 Dec' },
    ],
    links: [{ label: 'IHLT schedule', url: 'https://www.cs.upc.edu/~turmo/ihlt/plan32j/IHLT.html' }],
  },
  {
    id: 'iml-weekly-tests',
    date: '2026-11-18',
    kind: 'course',
    subject: 'iml',
    title: 'The IML weekly questionnaires are already in place',
    dek: 'T1 to T10, each on its Tuesday. Type your grade and you are done.',
    body: [
      'The questionnaires are done in class on Tuesdays, on the theory block of the week before. T1 and T2 were both on 6 October, and the last one, T10, is on **1 December**. T12 has no questionnaire.',
      'Together they are 20% of the Work mark, which is 12% of the final mark. The guide does not weight them, so they count the same.',
      'If you had typed one average for all of them, it has been copied to the questionnaires already done, so your IML grade has not changed.',
    ],
  },
  {
    id: 'imas-campus-dates',
    date: '2026-11-18',
    kind: 'course',
    subject: 'imas',
    title: 'IMAS Task 1 is due this Sunday at 23:55',
    dek: 'Choose your presentation slot by the same time. Task 2 follows Campus Virtual: 16 December.',
    body: [
      'Task 1, the design activity, is worth 15% of the final mark and is due **Sunday 22 November at 23:55**. The presentation slots close at the same time, and the presentations are the week of 25 November.',
      'Task 2, the preliminary revision of coordination and implementation, is 5%. The work plan says to deliver it on 13 December and discuss it in class on 16 December; Campus Virtual accepts it until **16 December at 23:55**.',
      'The final documentation and implementation (35%) is due on 10 January and the theory exam (40%) is on 13 January.',
      'The second call on 24 January is only for MESIIA: MAI grades close on 23 January.',
    ],
    changes: [{ what: 'Task 2 delivery', before: '13 Dec (work plan)', after: '16 Dec, 23:55' }],
    links: [
      { label: 'Task 1 on Campus', url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4372679' },
      { label: 'Choose a slot', url: 'https://campusvirtual.urv.cat/mod/choice/view.php?id=4372690' },
    ],
  },
  {
    id: 'par-campus-links',
    date: '2026-11-18',
    kind: 'course',
    subject: 'par',
    title: 'PAR Assignment #2, the fuzzy expert system, is due 14 December',
    dek: 'Each assignment and exam is now named as on Campus Virtual, with its link.',
    body: [
      'Assignment #2 is worth 15% and is due **14 December at 23:59**. The Approximate Reasoning exam is on 13 January at 11:00.',
      'Both practical exercises have to be accepted. If one is not, you can resubmit it on **17 January**, with a maximum of 8.',
      'The exam retake on 25 January is only for MESIIA students; MAI grades close before it.',
    ],
    links: [{ label: 'Assignment #2 on Campus', url: 'https://campusvirtual.urv.cat/mod/assign/view.php?id=4416201' }],
  },
  {
    id: 'iml-w3-moved',
    date: '2026-11-14',
    kind: 'course',
    subject: 'iml',
    title: 'IML Work 3 moves to 6 December, without an exam',
    dek: 'Code and report are due together, and the Work 3 exam becomes an ungraded contribution rubric.',
    body: [
      'Work 3 is now delivered on **Sunday 6 December**, code and report together. Each is half of the Work 3 mark.',
      'There is no Work 3 exam. Instead, each member fills in a rubric about everyone’s contribution. It is not graded.',
    ],
    changes: [
      { what: 'Code and report', before: 'Tue 24 Nov', after: 'Sun 6 Dec' },
      { what: 'Work 3 exam', before: '30% of Work 3', after: 'Ungraded rubric' },
    ],
  },
  {
    id: 'par-exam-moved',
    date: '2026-11-14',
    kind: 'course',
    subject: 'par',
    title: 'PAR Planning exam moves to Wednesday 18 November',
    dek: '11:00 to 13:00, rooms A215 and A207 in building E1. Ten true/false and ten multiple-choice questions.',
    body: [
      'The Planning theory exam is worth 30% of the final mark and needs at least a 5.',
      'It has 10 true/false and 10 multiple-choice questions, and is held in rooms A215 and A207 of building E1.',
    ],
    changes: [{ what: 'Planning exam', before: 'Wed 11 Nov', after: 'Wed 18 Nov, 11:00' }],
  },
  {
    id: 'cv-paper-dates',
    date: '2026-11-14',
    kind: 'course',
    subject: 'cv',
    title: 'CV paper presentation: the two dates to remember',
    dek: 'Article and group by 16 November; slides and critical discussion by 13 December.',
    body: [
      'Choose the article and your group by **16 November at 23:00**.',
      'Upload the slides and the critical discussion by **13 December at 23:00**. The presentations are on 15 December, from 15:30 to 18:30.',
    ],
  },
];

export const newsById = Object.fromEntries(NEWS.map((n) => [n.id, n]));
