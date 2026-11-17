# MAI Grades

A small, private grade tracker for students of the Master in Artificial Intelligence (UPC, UB, URV).

- Enter each grade as you get it and see your projected final mark and the points you have already secured.
- Pick a target (5 to 10) and see the average you need on what's left, including minimums such as IML's exam ≥ 3.5.
- What-if mode: drag sliders on ungraded items without touching your saved grades.
- Overview of the semester: ECTS-weighted average, a 0–10 scale per subject, and every deadline, which you can export as an `.ics` calendar file.
- Edit any subject's structure (items, weights, dates, minimums, resubmission cap), or create your own for optional subjects.
- Home is a dates dashboard: countdown rings for the next deadlines, a week or month calendar, and links to each course page (set `url` on a subject or item in `catalog.js`, or in Edit structure).
- Course news: a short dated list of changes. News the student hasn't seen yet is marked New, with a dot on the Home tab.
- Mark work as submitted (or an exam as taken, from its day on). A strip on Home shows how much of the semester is done; submitted work waits in Overview until it gets a grade.
- Customize Home: presets (Dates first, Grades first, Essentials) or your own order, with any block hidden. Saved with the rest of your data.
- Welcome aboard: a short guided tour the first time, with a hands-on example of what you need in an exam. Run it again from Settings.
- Exam details: date, time, room, duration, format, preparation tips and what you need, for every exam. Add them under `exam` on an item in `catalog.js`.
- See an example: made-up grades to look around before typing anything.
- Share what you need as an image, or send a group grade to your team as a link they confirm before it is saved.
- Ungraded dates (choosing a topic, a contribution rubric) appear alongside graded deadlines.
- When the course guides change, subjects you haven't edited update automatically; edited ones offer a one-click restore.

The About page explains what the app is for and how to report a change: by email (the address is only assembled on click, so it is not in the page source) or by forking this repository and opening a pull request.

Everything is stored in the browser (`localStorage`). There is no account, no server and no tracking. Export a JSON backup in Settings to move your grades to another device.

## Subjects included (2026–27, first semester)

| Code | Subject | Evaluation |
|------|---------|------------|
| IML  | Introduction to Machine Learning | 0.4 Exam + 0.6 Work, Exam ≥ 3.5 and Work ≥ 4.5 (Work 3 due 6 Dec, no Work 3 exam) |
| IHLT | Introduction to Human Language Technologies | 50% Exam + 50% Lab (sessions, STS project, questions) |
| CI   | Computational Intelligence | 50% Projects (EC, NC, FC) + 50% Exam |
| CV   | Computational Vision | 50% Practicum + 50% Theory, both ≥ 5 |
| IMAS | Introduction to Multi-Agent Systems | Task 1, revision, final delivery, teamwork, exam; theory and practice ≥ 5 |
| PAR  | Planning and Approximate Reasoning | Two practical exercises + two exams, each exam ≥ 5 |

Where a guide doesn't publish a weight (CI projects, CV labs and midterms), items are weighted equally and the assumption is noted in the app. Structures live in [`assets/js/catalog.js`](assets/js/catalog.js).

## Run locally

No build step and no dependencies.

```sh
python3 -m http.server 8080   # then open http://localhost:8080
npm test                      # grade engine tests (Node 20+)
```

## Deploy on GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root. All paths are relative, so it works under `https://<user>.github.io/mai-grades/`. When you change any file, bump `VERSION` in `sw.js` so installed copies update. When you change a subject in `catalog.js`, also bump `CATALOG_VERSION` so stored copies refresh, set `CHECKED` to today and add a line to `NEWS` with a new unique `id`. The link preview (`og:url`, `og:image` in `index.html`) assumes the site lives at `https://polmarsol.github.io/mai-grades/`; change it if the address differs.

## Structure

```
index.html            app shell, no-flash theme script, loader
404.html              custom not-found page for GitHub Pages
sw.js                 offline cache (service worker)
manifest.webmanifest  PWA manifest
assets/css/app.css    all styles, light and dark tokens
assets/js/grades.js   grade engine (pure functions, tested)
assets/js/catalog.js  official subject structures
assets/js/store.js    local-first state
assets/js/views/      home, subject, overview, settings, about
assets/js/editor.js   structure editor
```

Inter is bundled under the SIL Open Font License (`assets/fonts/OFL.txt`).
