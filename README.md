# MAI Grades

A small, private grade tracker for students of the Master in Artificial Intelligence (UPC, UB, URV).

- Enter each grade as you get it and see your projected final mark and the points you have already secured.
- Pick a target (5 to 10) and see the average you need on what's left, including minimums such as IML's exam ≥ 3.5.
- What-if mode: drag sliders on ungraded items without touching your saved grades.
- Overview of the semester: ECTS-weighted average, a 0–10 scale per subject, and every deadline, which you can export as an `.ics` calendar file.
- Edit any subject's structure (items, weights, dates, minimums, resubmission cap), or create your own for optional subjects.

Everything is stored in the browser (`localStorage`). There is no account, no server and no tracking. Export a JSON backup in Settings to move your grades to another device.

## Subjects included (2026–27, first semester)

| Code | Subject | Evaluation |
|------|---------|------------|
| IML  | Introduction to Machine Learning | 0.4 Exam + 0.6 Work, Exam ≥ 3.5 and Work ≥ 4.5 |
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

Settings → Pages → Deploy from a branch → `main` / root. All paths are relative, so it works under `https://<user>.github.io/mai-grades/`. When you change any file, bump `VERSION` in `sw.js` so installed copies update.

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
assets/js/views/      home, subject, overview, settings
assets/js/editor.js   structure editor
```

Inter is bundled under the SIL Open Font License (`assets/fonts/OFL.txt`).
