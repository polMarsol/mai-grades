import { esc, icon, scale, toast } from '../ui.js';

const REPO = 'https://github.com/polMarsol/mai-grades';

// The contact address is assembled only when someone asks for it, so it never
// appears as plain text in the page source for address harvesters to collect.
const contact = () => ['maicentralhub', ['gmail', 'com'].join('.')].join(String.fromCharCode(64));

const SAMPLE = { secured: 2.9, maxReachable: 9.3, projected: 8.1 };

export function renderAbout(root) {
  root.innerHTML = `
    <div class="about-page">
      <h1 class="display">Know where you stand in every subject</h1>
      <p class="lede">Each MAI subject is graded its own way: different weights, minimum marks, resubmission caps and dates, spread over three universities. MAI Grades keeps them in one place and does the arithmetic for you.</p>

      <div class="facts">
        <div class="fact">
          <h2>Your mark so far</h2>
          <p>Enter a grade when you get it. You see the points you have already secured and the final mark you are heading for.</p>
        </div>
        <div class="fact">
          <h2>What you still need</h2>
          <p>Pick a target from 5 to 10 and see the average you need on what's left, including rules such as a minimum mark in the exam.</p>
        </div>
        <div class="fact">
          <h2>What if</h2>
          <p>Try out grades for work you haven't handed in yet. Your saved grades don't change.</p>
        </div>
        <div class="fact">
          <h2>What's next</h2>
          <p>Every delivery and exam in one list, which you can add to your calendar.</p>
        </div>
        <div class="fact">
          <h2>Private</h2>
          <p>There is no account. Your grades are stored in this browser and are never sent anywhere.</p>
        </div>
      </div>

      <section class="block" aria-labelledby="h-read">
        <h2 class="section-title" id="h-read">How to read the bar</h2>
        <div class="card demo" data-color="blue">
          ${scale(SAMPLE, { size: 'lg', target: 7, label: 'Example' })}
          <ul class="legend">
            <li><span class="key key-secured"></span><span><strong>Secured.</strong> Points you already have, whatever happens next.</span></li>
            <li><span class="key key-reach"></span><span><strong>Still in play.</strong> The most you can reach if everything left goes perfectly.</span></li>
            <li><span class="key key-proj"></span><span><strong>Projected.</strong> Where you finish if you keep your current average.</span></li>
            <li><span class="key key-pass"></span><span><strong>Pass line.</strong> The 5 you need to pass.</span></li>
            <li><span class="key key-target"></span><span><strong>Target.</strong> The mark you chose to aim for.</span></li>
          </ul>
        </div>
      </section>

      <section class="block" aria-labelledby="h-help">
        <h2 class="section-title" id="h-help">Help keep it right</h2>
        <p class="muted">Professors move dates and change weights. If you spot something wrong or have an idea, there are two ways to tell us.</p>
        <div class="ways">
          <div class="card way">
            <h3>The lazy way</h3>
            <p>Write two lines saying what changed and where you saw it.</p>
            <div id="mail-out" class="mail-out">
              <button class="btn btn-primary btn-sm" type="button" id="mail-show">${icon('mail')}Show email address</button>
            </div>
            <p class="small">We never ask for passwords or campus logins. Ignore any message that does.</p>
          </div>
          <div class="card way">
            <h3>The hands-on way</h3>
            <p>The code is public. Fork the repository, make your change and open a pull request.</p>
            <a class="btn btn-ghost btn-sm" href="${REPO}" target="_blank" rel="noopener noreferrer">Open the repository on GitHub${icon('external')}</a>
          </div>
        </div>
      </section>

      <div class="fineprint">
        <p>The logo reads two ways: AI, and a 10.</p>
        <p>Made by a MAI student. Not an official tool of UPC, UB or URV: always check the course guide and Campus Virtual, which have the final word.</p>
      </div>
    </div>`;

  root.querySelector('#mail-show').addEventListener('click', () => {
    const addr = contact();
    const out = root.querySelector('#mail-out');
    out.innerHTML = `
      <a href="mailto:${esc(addr)}?subject=${encodeURIComponent('MAI Grades')}">${esc(addr)}</a>
      <button class="btn btn-ghost btn-sm" type="button" id="mail-copy">${icon('copy')}Copy</button>`;
    out.querySelector('a').focus();
    out.querySelector('#mail-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(addr);
        toast('Address copied');
      } catch {
        toast('Select the address and copy it');
      }
    });
  });
}
