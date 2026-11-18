// The list of calendar feeds and their contents, shared by the build script and the tests.
import { CATALOG, CHECKED } from '../assets/js/catalog.js';
import { buildFeed } from '../assets/js/ics.js';

export const SITE = 'https://polmarsol.github.io/mai-grades/';

export function feeds() {
  const all = { file: 'all.ics', text: buildFeed(CATALOG, { name: 'MAI deadlines', stamp: CHECKED, site: SITE }) };
  return [
    all,
    ...CATALOG.map((s) => ({ file: `${s.id}.ics`, text: buildFeed([s], { name: `MAI ${s.code}`, stamp: CHECKED, site: SITE }) })),
  ];
}
