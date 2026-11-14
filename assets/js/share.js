// Sharing: links through the system share sheet (or the clipboard), and a
// "what I need" image drawn on a canvas. Nothing is uploaded anywhere.
import { toast } from './ui.js';

export async function shareLink({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied');
  } catch {
    toast('Copy the link from the address bar');
  }
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draw the card. `big` is the number shown large, `lead` the line above it,
 * `tail` the sentence below. `mark` (0–10) places the dot on the scale.
 * The card never includes the grades you already have.
 */
export async function needCard({ code, name, color, lead, big, tail, mark }) {
  await document.fonts?.ready;
  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  const family = getComputedStyle(document.body).fontFamily;
  const font = (w, px) => `${w} ${px}px ${family}`;
  const ink = '#1d1d1f';
  const ink2 = '#6e6e73';
  const M = 96;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, S, S);
  ctx.textBaseline = 'alphabetic';

  // subject
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(M + 14, 150, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = font(700, 48);
  ctx.fillText(code, M + 46, 167);
  ctx.fillStyle = ink2;
  ctx.font = font(400, 32);
  ctx.fillText(wrap(ctx, name, S - 2 * M)[0], M, 222);

  // lead, number, tail
  ctx.font = font(500, 46);
  ctx.fillText(lead, M, 420);
  ctx.fillStyle = ink;
  ctx.font = font(700, 300);
  ctx.fillText(big, M - 12, 690);
  ctx.font = font(500, 46);
  let y = 780;
  for (const l of wrap(ctx, tail, S - 2 * M).slice(0, 2)) {
    ctx.fillText(l, M, y);
    y += 60;
  }

  // 0–10 scale with the pass line and one dot
  const tx = M;
  const tw = S - 2 * M;
  const ty = 912;
  ctx.fillStyle = '#ececef';
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#86868b';
  ctx.fillRect(tx + tw / 2 - 2, ty - 10, 4, 36);
  if (mark != null) {
    const cx = tx + (Math.max(0, Math.min(10, mark)) / 10) * tw;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, ty + 8, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, ty + 8, 17, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = ink2;
  ctx.font = font(500, 26);
  ctx.fillText('0', tx, ty + 64);
  ctx.textAlign = 'center';
  ctx.fillText('5', tx + tw / 2, ty + 64);
  ctx.textAlign = 'right';
  ctx.fillText('10', tx + tw, ty + 64);

  // footer
  ctx.fillStyle = ink;
  ctx.font = font(650, 30);
  ctx.fillText('MAI Grades', S - M, 167);
  ctx.textAlign = 'left';

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export async function shareImage(blob, filename, text) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
  toast('Image downloaded');
}
