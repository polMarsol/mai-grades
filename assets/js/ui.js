// Shared UI helpers: escaping, formatting, icons, the grade scale, motion.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Only http(s) links are ever rendered as external links. */
export const safeUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u.trim()) ? u.trim() : null);

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const fmt = (x, d = 2) => (x == null || Number.isNaN(x) ? '–' : x.toFixed(d));
export const pct = (f) => `${Math.round(f * 100)}%`;
export const pctFine = (f) => {
  const v = f * 100;
  return `${Number.isInteger(Math.round(v * 10) / 10) ? Math.round(v) : (Math.round(v * 10) / 10).toFixed(1)}%`;
};

const dayMs = 86400000;
export const today = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
export const parseDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const daysFrom = (iso) => Math.round((parseDate(iso) - today()) / dayMs);
export const fmtDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('en-GB', opts).format(parseDate(iso));
export function relDay(iso) {
  const n = daysFrom(iso);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  if (n > 1 && n < 14) return `in ${n} days`;
  if (n >= 14) return `in ${Math.round(n / 7)} weeks`;
  if (n > -14) return `${-n} days ago`;
  return `${Math.round(-n / 7)} weeks ago`;
}

export const STATUS = {
  'not-started': { label: 'No grades yet', tone: 'neutral', icon: 'dot' },
  'on-track': { label: 'On track', tone: 'good', icon: 'up' },
  'at-risk': { label: 'At risk', tone: 'warn', icon: 'alert' },
  passed: { label: 'Passed', tone: 'good', icon: 'check' },
  failed: { label: 'Not passing', tone: 'bad', icon: 'x' },
};

const PATHS = {
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  alert: '<path d="M12 8v5M12 16.5v.01"/><path d="M10.3 3.9L2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  dot: '<circle cx="12" cy="12" r="3.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
  external: '<path d="M8 16L16 8M9.5 8H16v6.5"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6.5A2.5 2.5 0 0 0 13 4H6.5A2.5 2.5 0 0 0 4 6.5V13a2.5 2.5 0 0 0 2.5 2.5h2"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.5v.01"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  reset: '<path d="M4 4v6h6"/><path d="M4.5 13.5A8 8 0 1 0 7 6.3L4 10"/>',
};

export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[name] || ''}</svg>`;

export const logo = (cls = '') => `<svg class="mark ${cls}" viewBox="2 10 44 28" aria-hidden="true" focusable="false"><path class="mark-ink m1" d="M4.5 35L11 13l6.5 22"/><path class="mark-ink m2" d="M7 28h8"/><path class="mark-ink m3" d="M26 13V35"/><path class="mark-ink m4" d="M22.6 15.4L26 13h3.2"/><path class="mark-ink m5" d="M22.8 35h6.4"/><path class="mark-zero m6" d="M37.8 13A5.2 11 0 1 1 37.79 13"/></svg>`;

/**
 * The grade scale: a 0–10 track showing points secured, what is still in play,
 * the projected grade, the pass line and an optional target.
 */
export function scale(ev, { target = null, size = 'sm', label = '' } = {}) {
  const p = (x) => `${(Math.max(0, Math.min(10, x)) * 10).toFixed(2)}%`;
  const proj = ev.projected;
  const parts = [
    `${fmt(ev.secured)} points secured`,
    `up to ${fmt(ev.maxReachable)} still reachable`,
    proj != null ? `projected ${fmt(proj)}` : 'no projection yet',
  ];
  if (target != null) parts.push(`target ${target}`);
  const aria = `${label ? `${label}: ` : ''}${parts.join(', ')}, out of 10.`;
  return `
  <div class="scale scale-${size}" role="img" aria-label="${esc(aria)}"
       style="--secured:${p(ev.secured)};--reach:${p(ev.maxReachable)};--proj:${proj != null ? p(proj) : '0%'};--target:${target != null ? p(target) : '0%'}">
    <div class="scale-track">
      <span class="scale-reach"></span>
      <span class="scale-secured"></span>
      <span class="scale-pass"></span>
      ${target != null ? '<span class="scale-target"></span>' : ''}
      ${proj != null ? '<span class="scale-proj"></span>' : ''}
    </div>
    ${size === 'lg' ? '<div class="scale-ticks" aria-hidden="true">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => `<span${t === 5 ? ' class="is-pass"' : ''}>${t}</span>`).join('') + '</div>' : ''}
  </div>`;
}

/** Update an existing scale element in place so its CSS transitions run. */
export function updateScale(el, ev, target = null) {
  if (!el) return;
  const fresh = document.createElement('div');
  fresh.innerHTML = scale(ev, { target, size: el.classList.contains('scale-lg') ? 'lg' : 'sm' });
  const next = fresh.firstElementChild;
  const track = el.querySelector('.scale-track');
  const nextTrack = next.querySelector('.scale-track');
  // keep marker elements in sync, then swap variables so widths animate
  if (track.innerHTML.replace(/\s/g, '') !== nextTrack.innerHTML.replace(/\s/g, '')) track.innerHTML = nextTrack.innerHTML;
  el.setAttribute('style', next.getAttribute('style'));
  el.setAttribute('aria-label', next.getAttribute('aria-label'));
}

export function statusPill(status) {
  const s = STATUS[status] || STATUS['not-started'];
  return `<span class="pill pill-${s.tone}">${icon(s.icon)}${s.label}</span>`;
}

/** Animate a number from its last shown value to `to`. */
export function countTo(el, to, d = 2) {
  if (!el) return;
  if (to == null || Number.isNaN(to)) {
    el.textContent = '–';
    el.dataset.v = '';
    return;
  }
  const from = el.dataset.v === '' || el.dataset.v == null ? (reducedMotion() ? to : 0) : Number(el.dataset.v);
  el.dataset.v = String(to);
  if (reducedMotion() || Math.abs(to - from) < 0.005) {
    el.textContent = to.toFixed(d);
    return;
  }
  const t0 = performance.now();
  const dur = 520;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - (1 - k) ** 3;
    el.textContent = (from + (to - from) * e).toFixed(d);
    if (k < 1 && el.dataset.v === String(to)) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

let io;
/** Fade-up elements with [data-reveal] as they enter the viewport (staggered by --i). */
export function reveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]:not(.is-in)');
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  io ||= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
  );
  els.forEach((el) => io.observe(el));
}

/** Soft light that follows the pointer on [data-spotlight] surfaces. */
export function spotlight(root = document) {
  if (!window.matchMedia('(hover: hover)').matches) return;
  root.querySelectorAll('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/** Navigate to a route, re-rendering even when the hash is already there. */
export function go(hash) {
  if (location.hash === hash) window.dispatchEvent(new Event('hashchange'));
  else location.hash = hash;
}

let toastTimer;
/** Short message at the top. `action` = { label, run } adds one button (for Undo). */
export function toast(msg, tone = 'neutral', action = null) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.dataset.tone = tone;
  el.classList.toggle('has-action', !!action);
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast-action';
    b.textContent = action.label;
    b.addEventListener('click', () => {
      el.classList.remove('is-on');
      action.run();
    });
    el.append(' ', b);
  }
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), action ? 5000 : 2600);
}

/** Promise-based confirm built on <dialog>. */
export function confirmDialog({ title, body, confirm = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'sheet sheet-sm';
    dlg.innerHTML = `
      <form method="dialog" class="sheet-body">
        <h2 class="sheet-title">${esc(title)}</h2>
        <p class="muted">${esc(body)}</p>
        <div class="sheet-actions">
          <button class="btn btn-ghost" value="cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="ok">${esc(confirm)}</button>
        </div>
      </form>`;
    document.body.append(dlg);
    openDialog(dlg);
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue === 'ok');
      dlg.remove();
      document.documentElement.classList.remove('has-overlay');
    });
  });
}

export function openDialog(dlg) {
  document.documentElement.classList.add('has-overlay');
  dlg.showModal();
  dlg.addEventListener('close', () => document.documentElement.classList.remove('has-overlay'), { once: true });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close('cancel');
  });
}

export function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}
