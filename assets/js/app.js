import { renderHome } from './views/home.js';
import { renderSubject } from './views/subject.js';
import { renderOverview } from './views/overview.js';
import { renderSettings } from './views/settings.js';
import { renderAbout } from './views/about.js';
import { renderAdd } from './views/add.js';
import { getState, eraseAll } from './store.js';
import { countVisit } from './install.js';
import { applyTheme, cycleTheme, getTheme } from './theme.js';
import { reveal, reducedMotion, toast, icon } from './ui.js';
import { takeMigrationNotice, unseenNews } from './store.js';
import { wireProgress } from './progress.js';

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
  if (parts[0] === 'about') return { name: 'about', params };
  if (parts[0] === 'add') return { name: 'add', params };
  return { name: 'home', params };
}

const TITLES = { home: 'Home', overview: 'Overview', settings: 'Settings', about: 'About', add: 'Add a grade' };

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
    else if (r.name === 'about') renderAbout(main);
    else if (r.name === 'add') renderAdd(main, r.params);
    else renderSettings(main, r.params);
    const h1 = main.querySelector('h1');
    document.title = `${r.name === 'subject' ? h1?.textContent : TITLES[r.name]} – MAI Grades`;
    if (getState().demo && r.name !== 'add') {
      const banner = document.createElement('div');
      banner.className = 'sim-banner demo-banner';
      banner.innerHTML = `<p>These are example grades, so you can look around.</p><button class="btn btn-primary btn-sm" type="button">Clear and start with yours</button>`;
      banner.querySelector('button').addEventListener('click', () => {
        eraseAll();
        toast('Example cleared');
        if (location.hash === '#/') render();
        else location.hash = '#/';
      });
      main.prepend(banner);
    }
    reveal(main);
    // dot on the Home tab while there is course news the student hasn't seen
    const homeLink = nav.querySelector('[data-section="home"]');
    const n = unseenNews().length;
    homeLink.classList.toggle('has-news', n > 0);
    homeLink.setAttribute('aria-label', n > 0 ? `Home, ${n} new ${n === 1 ? 'update' : 'updates'}` : 'Home');
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

countVisit();
wireProgress();
applyTheme();
themeIcon();
runLoader();
render();
const refreshed = takeMigrationNotice();
if (refreshed.length) setTimeout(() => toast(`Updated from the latest course news: ${refreshed.join(', ')}`), 1700);
window.addEventListener('hashchange', render);
window.addEventListener('resize', moveIndicator);
document.fonts?.ready.then(moveIndicator);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
