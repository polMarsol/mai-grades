// Theme preference. The inline script in index.html applies it before first paint.
const KEY = 'mai-grades:theme';

export const getTheme = () => {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
};

export function applyTheme(t = getTheme()) {
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#ffffff');
}

export function setTheme(t) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
  const swap = () => applyTheme(t);
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(swap);
  else swap();
}

/** Cycle used by the nav button: system → light → dark → system. */
export function cycleTheme() {
  const order = ['system', 'light', 'dark'];
  const next = order[(order.indexOf(getTheme()) + 1) % order.length];
  setTheme(next);
  return next;
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme('system');
});
