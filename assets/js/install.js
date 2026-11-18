// A quiet "add to your home screen" line, shown from the second visit on.
import { icon } from './ui.js';
import { safetyCard, mountSafety, isStandalone, isIOS } from './safety.js';

const VISITS = 'mai-grades:visits';
const DISMISSED = 'mai-grades:install-dismissed';
let deferred = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  document.querySelectorAll('[data-install-slot]').forEach(mountInstallHint);
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  document.querySelectorAll('[data-install-slot]').forEach((el) => (el.innerHTML = ''));
});

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

/** Count one visit per browser session. */
export function countVisit() {
  try {
    if (sessionStorage.getItem(VISITS)) return;
    sessionStorage.setItem(VISITS, '1');
  } catch {
    return;
  }
  write(VISITS, String((Number(read(VISITS)) || 0) + 1));
}

export function mountInstallHint(slot) {
  if (!slot) return;
  slot.innerHTML = '';
  // keeping grades safe comes before the install suggestion
  const card = safetyCard();
  if (card) return mountSafety(slot, card);
  if (isStandalone() || read(DISMISSED) || (Number(read(VISITS)) || 0) < 2) return;
  if (!deferred && !isIOS()) return;
  slot.innerHTML = `
    <div class="install">
      <p>${
        deferred
          ? 'Add MAI Grades to your home screen to open it like an app, even offline.'
          : `Add MAI Grades to your home screen: tap ${icon('share')}<span class="sr-only">Share</span> and then “Add to Home Screen”.`
      }</p>
      ${deferred ? '<button class="btn btn-ghost btn-sm" type="button" data-install>Add to home screen</button>' : ''}
      <button class="icon-btn" type="button" data-install-dismiss aria-label="Don't show this again">${icon('x')}</button>
    </div>`;
  slot.querySelector('[data-install]')?.addEventListener('click', async () => {
    const e = deferred;
    deferred = null;
    slot.innerHTML = '';
    await e.prompt();
  });
  slot.querySelector('[data-install-dismiss]').addEventListener('click', () => {
    write(DISMISSED, '1');
    slot.innerHTML = '';
  });
}
