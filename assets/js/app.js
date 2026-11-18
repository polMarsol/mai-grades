import { renderHome } from './views/home.js';
import { renderSubject } from './views/subject.js';
import { renderOverview } from './views/overview.js';
import { renderStats } from './views/stats.js';
import { renderNews, renderArticle } from './views/news.js';
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
  if (parts[0] === 'stats') return { name: 'stats', params };
  if (parts[0] === 'news' && parts[1]) return { name: 'article', id: decodeURIComponent(parts[1]), params };
  if (parts[0] === 'news') return { name: 'news', params };
  if (parts[0] === 'settings') return { name: 'settings', params };
  if (parts[0] === 'about') return { name: 'about', params };
  if (parts[0] === 'add') return { name: 'add', params };
  return { name: 'home', params };
}

const TITLES = { home: 'Home', overview: 'Overview', stats: 'Stats', news: 'News', settings: 'Settings', about: 'About', add: 'Add a grade' };

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
    else if (r.name === 'stats') renderStats(main);
    else if (r.name === 'news') renderNews(main);
    else if (r.name === 'article') renderArticle(main, r.id);
    else if (r.name === 'about') renderAbout(main);
    else if (r.name === 'add') renderAdd(main, r.params);
    else renderSettings(main, r.params);
    const h1 = main.querySelector('h1');
    document.title = `${r.name === 'subject' || r.name === 'article' ? h1?.textContent : TITLES[r.name]} – MAI Grades`;
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
    // a dot on the News button while there are stories the student hasn't read
    const newsBtn = document.getElementById('news-btn');
    const n = unseenNews().length;
    newsBtn.classList.toggle('has-news', n > 0);
    newsBtn.setAttribute('aria-label', n > 0 ? `News, ${n} unread` : 'News');
    if (r.name === 'news' || r.name === 'article') newsBtn.setAttribute('aria-current', 'page');
    else newsBtn.removeAttribute('aria-current');
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

// Splash: draws once per browser session. AI is drawn, the 0 fills while a counter
// runs to 10, then the mark flies into the top bar. Tap anywhere to skip.
function runLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const root = document.documentElement;
  let seen = false;
  try {
    seen = sessionStorage.getItem('mai-grades:intro') === '1';
    sessionStorage.setItem('mai-grades:intro', '1');
  } catch {
    /* ignore */
  }
  if (seen || reducedMotion()) {
    loader.remove();
    root.classList.remove('is-loading');
    return;
  }

  const stage = loader.querySelector('.splash-stage');
  const tilt = loader.querySelector('.splash-tilt');
  const svg = loader.querySelector('.mark-draw');
  const count = loader.querySelector('.splash-count');
  let phase = 'run';
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  const runCounter = (dur) => {
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      count.textContent = (10 * (1 - (1 - k) ** 3)).toFixed(1);
      if (k < 1 && phase === 'run') requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const finish = () => {
    loader.remove();
    root.classList.remove('is-landing');
  };

  const fly = () => {
    if (phase === 'fly') return;
    phase = 'fly';
    timers.forEach(clearTimeout);
    count.textContent = '10.0';
    tilt.style.transform = '';
    const target = document.querySelector('.brand .mark');
    root.classList.add('is-landing');
    root.classList.remove('is-loading');
    loader.classList.add('is-flying');
    if (!target || !stage.animate) return finish();
    const f = svg.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const dx = t.left + t.width / 2 - (f.left + f.width / 2);
    const dy = t.top + t.height / 2 - (f.top + f.height / 2);
    const scale = t.width / f.width;
    const anim = stage.animate(
      [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
      { duration: 720, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', fill: 'forwards' },
    );
    anim.onfinish = finish;
    setTimeout(finish, 1400); // in case the animation never reports back
  };

  // Skip: jump to the full mark and fly straight away.
  const skip = () => {
    if (phase !== 'run') return;
    timers.forEach(clearTimeout);
    loader.classList.add('is-instant', 'is-full');
    count.textContent = '10.0';
    setTimeout(fly, 260);
    phase = 'skipping';
  };

  // The mark leans towards the pointer while it draws.
  loader.addEventListener('pointermove', (e) => {
    if (phase !== 'run' || e.pointerType === 'touch') return;
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    tilt.style.transform = `perspective(700px) rotateX(${(-y * 18).toFixed(2)}deg) rotateY(${(x * 24).toFixed(2)}deg)`;
  });
  loader.addEventListener('click', skip);

  loader.classList.add('is-run');
  at(900, () => runCounter(550));
  at(1450, () => loader.classList.add('is-full'));
  at(2250, fly);
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
  window.addEventListener('load', () => {
    // A page that already had a worker is running the old version when a new one takes over.
    const hadWorker = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => hadWorker && showUpdateBar());
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        // look for a new version whenever the app comes back to the front, and every hour
        const check = () => reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => !document.hidden && check());
        setInterval(check, 60 * 60 * 1000);
      })
      .catch(() => {});
  });
}

/** A bar that stays until the student reloads: new dates should not go unnoticed. */
function showUpdateBar() {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'update-bar';
  bar.className = 'update-bar';
  bar.setAttribute('role', 'status');
  bar.innerHTML = `
    <span class="update-text"><strong>New version ready.</strong> Dates or features have changed.</span>
    <button type="button" class="update-go">Reload</button>
    <button type="button" class="icon-btn update-x" aria-label="Later">${icon('x')}</button>`;
  bar.querySelector('.update-go').addEventListener('click', () => location.reload());
  bar.querySelector('.update-x').addEventListener('click', () => bar.remove());
  document.body.append(bar);
  requestAnimationFrame(() => bar.classList.add('is-on'));
}
