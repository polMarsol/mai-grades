// Welcome aboard: a short guided tour of Home, with one hands-on step.
import { getState } from './store.js';
import { esc, icon, scale, fmt, reducedMotion } from './ui.js';

const KEY = 'mai-grades:tour';
let running = false;

const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
};

// The hands-on step: 60% of a subject graded with an average of 6.5, exam worth 40% left.
const DEMO = { done: 0.6, avg: 6.5, exam: 0.4 };
function demoState(x) {
  const secured = DEMO.done * DEMO.avg;
  const final = secured + DEMO.exam * x;
  const need = (5 - secured) / DEMO.exam;
  return { ev: { secured, maxReachable: secured + DEMO.exam * 10, projected: final }, final, need };
}
function demoHtml() {
  const { ev, final, need } = demoState(7);
  return `
    <div class="tour-demo" data-color="blue">
      <p class="tour-demo-q">Try it: you have <strong>6.50</strong> on the first 60% of a subject, and the exam is worth the other 40%.</p>
      <div class="tour-demo-scale">${scale(ev, { target: 5 })}</div>
      <label class="tour-demo-slider">
        <span>Exam grade</span>
        <input type="range" min="0" max="10" step="0.1" value="7" aria-describedby="tour-demo-out">
        <output class="num">7.0</output>
      </label>
      <p class="tour-demo-out" id="tour-demo-out" aria-live="polite">Final mark <strong class="num">${fmt(final)}</strong>. You need ${fmt(need)} in the exam to pass.</p>
    </div>`;
}

function steps() {
  const st = getState();
  const first = st.subjects[0];
  return [
    {
      title: 'Welcome aboard',
      text: 'MAI Grades keeps every deadline and grade of the master in one place, on this device. Here is a one-minute tour.',
      primary: 'Show me around',
      secondary: 'Skip',
    },
    {
      target: '.dash-side',
      title: 'Next up',
      text: 'Your next deadlines, soonest first. The ring fills as the day gets closer. Tick Submitted when you hand something in and it moves out of the way.',
    },
    {
      target: '#cal',
      title: 'Calendar',
      text: 'Every delivery and exam of the semester. Tap a marked day to see what is due, or switch to the week view.',
    },
    {
      target: '.tiles .tile:not(.tile-add)',
      title: 'Your subjects',
      text: 'Each card shows your grade so far on a 0 to 10 bar: what you have secured, what is still in play, and where you are heading. Tap a card to enter grades.',
      demo: true,
    },
    {
      target: '#progress',
      title: 'Your semester',
      text: 'One block per assessment. They fill in with the colour of the subject as you hand things in or get grades.',
    },
    {
      target: '#customize',
      title: 'Make it yours',
      text: 'Move or hide blocks, or pick a preset such as Grades first or Essentials.',
    },
    {
      target: '.nav-links',
      title: 'Everything else',
      text: 'Overview has every deadline and a calendar file for Google or Apple Calendar. Settings has backups and your list of subjects.',
    },
    {
      title: 'You are all set',
      text: first ? `Start with a grade you already have: open ${first.code} and type it in.` : 'Add your subjects in Settings to get started.',
      primary: 'Done',
      secondary: first ? `Open ${first.code}` : null,
      secondaryHref: first ? `#/s/${encodeURIComponent(first.id)}` : null,
    },
  ];
}

const visible = (el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};

/** Start the tour on Home: automatically once per device, or on request. */
export function maybeStartTour({ force = false } = {}) {
  if (running || (!force && seen()) || !getState().onboarded) return;
  const go = () => {
    if (document.getElementById('loader') || document.documentElement.classList.contains('is-landing')) {
      setTimeout(go, 250);
      return;
    }
    if (!document.getElementById('home')) return;
    run();
  };
  setTimeout(go, force ? 150 : 600);
}

function run() {
  running = true;
  const all = steps().filter((s) => !s.target || visible(document.querySelector(s.target)));
  const total = all.filter((s) => s.target).length;
  let i = 0;
  const back = document.activeElement;

  const root = document.createElement('div');
  root.className = 'tour';
  root.innerHTML = `
    <div class="tour-spot" aria-hidden="true"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title"></div>`;
  document.body.append(root);
  document.documentElement.classList.add('has-tour');
  const spot = root.querySelector('.tour-spot');
  const card = root.querySelector('.tour-card');

  let raf = 0;
  const follow = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(place);
  };
  const close = () => {
    markSeen();
    running = false;
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', follow);
    document.removeEventListener('keydown', onKey, true);
    document.documentElement.classList.remove('has-tour');
    root.remove();
    back?.focus?.({ preventScroll: true });
  };

  function place() {
    const s = all[i];
    const el = s.target && document.querySelector(s.target);
    const vw = innerWidth;
    const vh = innerHeight;
    const phone = vw < 640;
    root.classList.toggle('is-center', !el);
    root.classList.toggle('is-phone', phone);
    if (!el) {
      spot.style.cssText = '';
      card.style.cssText = '';
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 8;
    // on a phone the card sits at the bottom, or at the top when the target is low on the screen
    const cardTop = phone && (r.top + r.bottom) / 2 > vh * 0.55;
    root.classList.toggle('is-top', cardTop);
    const ch0 = phone ? card.offsetHeight + 24 : 0;
    const top = Math.max(r.top - pad, phone && cardTop ? ch0 : 4);
    const bottom = Math.min(r.bottom + pad, vh - (phone && !cardTop ? ch0 : 4));
    spot.style.cssText = `left:${r.left - pad}px;top:${top}px;width:${r.width + pad * 2}px;height:${Math.max(40, bottom - top)}px`;
    if (phone) {
      card.style.cssText = '';
      return;
    }
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    let x;
    let y;
    if (r.right + 20 + cw < vw) {
      x = r.right + 20;
      y = r.top;
    } else if (r.left - 20 - cw > 0) {
      x = r.left - 20 - cw;
      y = r.top;
    } else {
      x = r.left + r.width / 2 - cw / 2;
      y = r.bottom + 20 + ch < vh ? r.bottom + 20 : r.top - 20 - ch;
    }
    x = Math.min(Math.max(16, x), vw - cw - 16);
    y = Math.min(Math.max(16, y), vh - ch - 16);
    card.style.cssText = `left:${x}px;top:${y}px`;
  }

  function show(k) {
    i = k;
    const s = all[i];
    const num = s.target ? all.slice(0, i + 1).filter((x) => x.target).length : 0;
    const isLast = i === all.length - 1;
    card.innerHTML = `
      ${num ? `<p class="tour-step">${num} of ${total}</p>` : `<span class="tour-mark" aria-hidden="true">${document.querySelector('.brand .mark')?.outerHTML || ''}</span>`}
      <h2 class="tour-title" id="tour-title" tabindex="-1">${esc(s.title)}</h2>
      <p class="tour-text">${esc(s.text)}</p>
      ${s.demo ? demoHtml() : ''}
      <div class="tour-actions">
        ${
          s.primary
            ? `${s.secondary ? (s.secondaryHref ? `<a class="btn btn-ghost" href="${esc(s.secondaryHref)}" data-tour="open">${esc(s.secondary)}</a>` : `<button type="button" class="btn btn-ghost" data-tour="skip">${esc(s.secondary)}</button>`) : ''}
               <button type="button" class="btn btn-primary" data-tour="${isLast ? 'done' : 'next'}">${esc(s.primary)}</button>`
            : `<button type="button" class="link-btn tour-skip" data-tour="skip">Skip tour</button>
               <span class="tour-nav">
                 <button type="button" class="btn btn-ghost btn-sm" data-tour="back">${icon('back')}Back</button>
                 <button type="button" class="btn btn-primary btn-sm" data-tour="next">Next</button>
               </span>`
        }
      </div>`;
    const el = s.target && document.querySelector(s.target);
    if (el) {
      const r = el.getBoundingClientRect();
      const phone = innerWidth < 640;
      const roomTop = 72;
      const fits = r.top >= roomTop && r.bottom <= innerHeight - (phone ? 300 : 24);
      if (!fits) window.scrollTo({ top: scrollY + r.top - roomTop, behavior: reducedMotion() ? 'instant' : 'smooth' });
    }
    requestAnimationFrame(place);
    setTimeout(place, reducedMotion() ? 0 : 420);
    card.querySelector('#tour-title').focus({ preventScroll: true });
    if (s.demo) wireDemo();
  }

  function wireDemo() {
    const box = card.querySelector('.tour-demo');
    const range = box.querySelector('input[type=range]');
    const out = box.querySelector('output');
    const text = box.querySelector('.tour-demo-out');
    const update = () => {
      const x = Number(range.value);
      const { ev, final, need } = demoState(x);
      out.textContent = x.toFixed(1);
      range.style.setProperty('--fill', `${x * 10}%`);
      box.querySelector('.tour-demo-scale').innerHTML = scale(ev, { target: 5 });
      text.innerHTML =
        final >= 5
          ? `Final mark <strong class="num">${fmt(final)}</strong>. That passes: you only needed ${fmt(need)} in the exam.`
          : `Final mark <strong class="num">${fmt(final)}</strong>. Not enough yet: you need ${fmt(need)} in the exam to pass.`;
    };
    range.addEventListener('input', update);
    update();
  }

  card.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tour]');
    if (!b) return;
    const act = b.dataset.tour;
    if (act === 'next') show(Math.min(all.length - 1, i + 1));
    else if (act === 'back') show(Math.max(0, i - 1));
    else if (act === 'open') close();
    else close();
  });

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowRight' && e.target.type !== 'range') show(Math.min(all.length - 1, i + 1));
    else if (e.key === 'ArrowLeft' && e.target.type !== 'range') show(Math.max(0, i - 1));
    else if (e.key === 'Tab') {
      // keep focus inside the card
      const f = [...card.querySelectorAll('button, a[href], input')];
      if (!f.length) return;
      const firstEl = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || !card.contains(document.activeElement))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  }
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', follow, { passive: true });
  show(0);
}
