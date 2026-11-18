// Writes the calendar feeds students subscribe to: calendar/all.ics and one per subject.
// Run after changing dates in assets/js/catalog.js:   node tools/build-calendars.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feeds } from './calendars.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(root, 'calendar'), { recursive: true });
for (const f of feeds()) {
  writeFileSync(join(root, 'calendar', f.file), f.text);
  console.log(`calendar/${f.file}`);
}
