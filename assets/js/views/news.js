// News: a front page of stories, and one page per story.
import { NEWS, newsById } from '../news.js';
import { catalogById } from '../catalog.js';
import { getState, unseenNews, markNewsSeen } from '../store.js';
import { esc, icon, fmtDate, safeUrl } from '../ui.js';

const LOGO = document.querySelector('.brand .mark')?.outerHTML || '';

// line drawings for app news covers, on a 120 × 80 grid
const ART = {
  calendar: `<rect x="22" y="14" width="76" height="58" rx="9"/><path d="M22 30h76M42 8v12M78 8v12"/><path class="art-accent" d="M50 52l8 8 16-18"/>`,
  stats: `<path d="M16 66h88"/><path d="M18 56l22-18 18 10 22-22 22 8"/><circle class="art-accent-fill" cx="40" cy="38" r="4"/><circle class="art-accent-fill" cx="58" cy="48" r="4"/><circle class="art-accent-fill" cx="80" cy="26" r="4"/><circle class="art-accent-fill" cx="102" cy="34" r="4"/>`,
  update: `<path d="M86 30a28 28 0 1 0 4 22"/><path d="M90 14v18H72"/><path class="art-accent" d="M60 30v14l9 6"/>`,
};

/** Stories for this student: app news, and course news for their subjects (all of it if they have none). */
export function myNews() {
  const mine = new Set(getState().subjects.map((s) => s.id));
  return NEWS.filter((n) => n.kind === 'app' || !mine.size || mine.has(n.subject)).sort((a, b) => b.date.localeCompare(a.date));
}

const subjectOf = (n) => (n.subject ? getState().subjects.find((s) => s.id === n.subject) || catalogById[n.subject] : null);
const colorOf = (n) => (n.kind === 'app' ? 'ink' : subjectOf(n)?.color || 'ink');

/** **bold** and [text](https://...) inside already-escaped text. */
function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      const u = safeUrl(url.replace(/&amp;/g, '&'));
      return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${label}</a>` : label;
    });
}
const plain = (text) => String(text).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

function kicker(n) {
  if (n.kind === 'app') return `<span class="kicker" data-color="ink"><span class="code-dot" aria-hidden="true"></span>MAI Grades</span>`;
  const s = subjectOf(n);
  return `<span class="kicker" data-color="${esc(s?.color || 'ink')}"><span class="code-dot" aria-hidden="true"></span>${esc(s?.code || n.subject)}</span>`;
}

/** The photo when there is one; otherwise a cover drawn in the subject's colour. */
function cover(n, size) {
  const img = n.image && n.image.src && !/^javascript:/i.test(n.image.src);
  if (img)
    return `<figure class="cover cover-${size} has-photo"><img src="${esc(n.image.src)}" alt="${esc(n.image.alt || '')}" loading="lazy" decoding="async"></figure>`;
  const s = subjectOf(n);
  const big =
    n.kind !== 'app'
      ? `<span class="cover-code">${esc(s?.code || '')}</span>`
      : ART[n.art]
        ? `<svg class="cover-art" viewBox="0 0 120 80" aria-hidden="true">${ART[n.art]}</svg>`
        : LOGO;
  return `
    <figure class="cover cover-${size} ${n.kind === 'app' ? 'cover-app' : 'cover-course'}" data-color="${esc(colorOf(n))}" aria-hidden="true">
      <span class="cover-rule"></span>
      ${big}
      <span class="cover-date">${fmtDate(n.date, { day: 'numeric', month: 'short' })}</span>
    </figure>`;
}

const minutes = (n) => Math.max(1, Math.round([n.title, n.dek, ...(n.body || [])].join(' ').split(/\s+/).length / 200));

function card(n, fresh, featured = false) {
  return `
    <article class="story${featured ? ' story-lead' : ''}" data-color="${esc(colorOf(n))}">
      <a class="story-link" href="#/news/${esc(n.id)}">
        ${cover(n, featured ? 'lead' : 'card')}
        <div class="story-text">
          <p class="story-meta">${kicker(n)}<time datetime="${n.date}">${fmtDate(n.date, { day: 'numeric', month: 'long' })}</time>${fresh ? '<span class="tag tag-new">New</span>' : ''}</p>
          <h2 class="story-title">${esc(n.title)}</h2>
          <p class="story-dek">${esc(n.dek)}</p>
        </div>
      </a>
    </article>`;
}

let filter = 'all';

export function renderNews(root) {
  const fresh = new Set(unseenNews().map((n) => n.id));
  const all = myNews();
  const list = all.filter((n) => filter === 'all' || n.kind === filter);
  const [lead, ...rest] = list;
  root.innerHTML = `
    <div class="news-page">
      <div class="news-head">
        <div>
          <h1 class="display">News</h1>
          <p class="lede">What changed in your subjects, explained, and what is new in MAI Grades.</p>
        </div>
        <div class="segmented" role="group" aria-label="Show">
          ${[['all', 'All'], ['course', 'Courses'], ['app', 'App']]
            .map(([k, l]) => `<button type="button" data-filter="${k}" aria-pressed="${filter === k}">${l}</button>`)
            .join('')}
        </div>
      </div>
      ${
        lead
          ? `${card(lead, fresh.has(lead.id), true)}
             ${rest.length ? `<div class="story-grid">${rest.map((n) => card(n, fresh.has(n.id))).join('')}</div>` : ''}`
          : '<p class="muted news-empty">Nothing here yet.</p>'
      }
      <p class="news-foot muted small">Spotted a change before it shows up here? Open the subject and use “Report it on GitHub”, or <a href="#/about">write to us</a>.</p>
    </div>`;
  root.querySelector('.segmented').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    renderNews(root);
    root.querySelector(`[data-filter="${filter}"]`)?.focus();
  });
  // seeing the front page counts as reading the headlines
  markNewsSeen(all.map((n) => n.id));
}

export function renderArticle(root, id) {
  const n = newsById[id];
  if (!n) {
    root.innerHTML = `<section class="empty"><h1 class="display">Story not found</h1><p class="lede">It may have been removed.</p><a class="btn btn-primary" href="#/news">All news</a></section>`;
    return;
  }
  const s = subjectOf(n);
  const more = myNews().filter((x) => x.id !== n.id).slice(0, 3);
  const links = (n.links || []).map((l) => ({ ...l, url: safeUrl(l.url) })).filter((l) => l.url);
  root.innerHTML = `
    <article class="article" data-color="${esc(colorOf(n))}">
      <a class="back" href="#/news">${icon('back')}News</a>
      <header class="article-head">
        <p class="story-meta">${kicker(n)}${n.kind === 'course' && s?.name ? `<span>${esc(s.name)}</span>` : ''}</p>
        <h1 class="article-title">${esc(n.title)}</h1>
        <p class="article-dek">${esc(n.dek)}</p>
        <p class="article-byline muted small"><time datetime="${n.date}">${fmtDate(n.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time><span aria-hidden="true">  </span><span>${minutes(n)} min read</span></p>
      </header>
      ${cover(n, 'article')}
      ${
        n.changes?.length
          ? `<section class="changes" aria-labelledby="ch-title">
              <h2 class="changes-title" id="ch-title">What changed</h2>
              <dl>
                ${n.changes
                  .map(
                    (c) => `
                  <div class="change">
                    <dt>${esc(c.what)}</dt>
                    <dd>${c.before ? `<s class="change-before"><span class="sr-only">Before: </span>${esc(c.before)}</s><span class="change-arrow" aria-hidden="true">${icon('arrow')}</span>` : ''}<span class="change-after"><span class="sr-only">Now: </span>${esc(c.after)}</span></dd>
                  </div>`,
                  )
                  .join('')}
              </dl>
            </section>`
          : ''
      }
      <div class="article-body">${(n.body || []).map((p) => `<p>${inline(p)}</p>`).join('')}</div>
      ${
        links.length || (n.kind === 'course' && s)
          ? `<div class="article-actions">
              ${n.kind === 'course' && s && getState().subjects.some((x) => x.id === s.id) ? `<a class="btn btn-primary" href="#/s/${esc(s.id)}">Open ${esc(s.code)}</a>` : ''}
              ${links.map((l) => `<a class="btn btn-ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${icon('external')}</a>`).join('')}
            </div>`
          : ''
      }
    </article>
    ${
      more.length
        ? `<section class="block more-news" aria-labelledby="h-more">
            <div class="block-head"><h2 class="section-title" id="h-more">More news</h2><a class="link-more" href="#/news">All news</a></div>
            <div class="story-grid story-grid-3">${more.map((x) => card(x, false)).join('')}</div>
          </section>`
        : ''
    }`;
  markNewsSeen([n.id]);
  document.title = `${plain(n.title)} – MAI Grades`;
}
