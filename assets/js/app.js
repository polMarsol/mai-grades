import { renderHome } from './views/home.js';
import { renderSubject } from './views/subject.js';
import { renderOverview } from './views/overview.js';
import { renderSettings } from './views/settings.js';
import { applyTheme, cycleTheme, getTheme } from './theme.js';
import { reveal, spotlight, reducedMotion, toast, icon } from './ui.js';

const main = document.getElementById('main');
const nav = document.querySelector('.nav-links');
const indicator = document.querySelector('.nav-indicator');

function parseRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 's' && parts[1]) return { name: 'subject', id: decodeURIComponent(parts[1]), params };
  if (parts[0] === 'overview') return { name: 'overview', params };
  if (parts[0] === 'settings') return { name: 'settings', params };
  return { name: 'home', params };
}

const TITLES = { home: 'Subjects', overview: 'Overview', settings: 'Settings' };

function moveIndicator() {
  const active = nav.querySelector('[aria-current="page"]');
  if (!active) {
    indicator.style.opacity = '0';
    return;
  }
  indicator.style.opacity = '1';
  indicator.style.width = `${active.offsetWidth}px`;
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
}

let first = true;
function render() {
  const r = parseRoute();
  const section = r.name === 'subject' ? 'home' : r.name;
  nav.querySelectorAll('a').forEach((a) => {
    if (a.dataset.section === section) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  moveIndicator();

  const draw = () => {
    if (r.name === 'home') renderHome(main);
    else if (r.name === 'subject') renderSubject(main, r.id);
    else if (r.name === 'overview') renderOverview(main);
    else renderSettings(main, r.params);
    const h1 = main.querySelector('h1');
    document.title = `${r.name === 'subject' ? h1?.textContent : TITLES[r.name]} – MAI Grades`;
    reveal(main);
    spotlight(main);
  };

  if (!first && document.startViewTransition && !reducedMotion()) document.startViewTransition(draw);
  else draw();

  if (!first) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  }
  first = false;
}

// Theme toggle in the nav
const themeBtn = document.getElementById('theme-btn');
const themeIcon = () => {
  const t = getTheme();
  themeBtn.innerHTML = icon(t === 'dark' ? 'moon' : t === 'light' ? 'sun' : 'auto');
  themeBtn.setAttribute('aria-label', `Theme: ${t === 'system' ? 'automatic' : t}. Change theme`);
};
themeBtn.addEventListener('click', () => {
  const t = cycleTheme();
  themeIcon();
  toast(`Theme: ${t === 'system' ? 'automatic' : t}`);
  if (parseRoute().name === 'settings') render();
});

// Loader: draws once per browser session, can be skipped.
function runLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  let seen = false;
  try {
    seen = sessionStorage.getItem('mai-grades:intro') === '1';
    sessionStorage.setItem('mai-grades:intro', '1');
  } catch {
    /* ignore */
  }
  const done = () => {
    if (loader.dataset.done) return;
    loader.dataset.done = '1';
    document.documentElement.classList.remove('is-loading');
    loader.classList.add('is-out');
    setTimeout(() => loader.remove(), 700);
  };
  if (seen || reducedMotion()) {
    loader.remove();
    document.documentElement.classList.remove('is-loading');
    return;
  }
  loader.querySelector('.loader-skip').addEventListener('click', done);
  loader.classList.add('is-run');
  setTimeout(done, 1500);
}

applyTheme();
themeIcon();
runLoader();
render();
window.addEventListener('hashchange', render);
window.addEventListener('resize', moveIndicator);
document.fonts?.ready.then(moveIndicator);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
