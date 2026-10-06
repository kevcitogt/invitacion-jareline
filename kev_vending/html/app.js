/* =========================================================
   kev_vending v3 - NUI de las máquinas
   ========================================================= */
const IN_GAME = typeof GetParentResourceName === 'function';
const RES = IN_GAME ? GetParentResourceName() : 'kev_vending';

/* Si quieres usar FOTOS reales de la moneda, pon los PNG (fondo transparente)
   en html/img/ y descomenta la línea de img en fxmanifest.lua */
const COIN_IMAGES = null; // { front: 'img/q1_anverso.png', back: 'img/q1_reverso.png' }

const $ = (id) => document.getElementById(id);
const S = { products: [], credit: 0, coins: 0, symbol: 'Q', busy: false, open: false, code: '', sel: null, sugar: 2, cols: 3, pending: null };

/* ---------------- SONIDO (sintetizado, sin archivos) ---------------- */
let AC;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(freq, type, dur, vol, when = 0, slideTo) {
  const c = ac(), t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  env(g, t, 0.004, vol, dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, when = 0, freq = 1200, q = 1) {
  const c = ac(), t = c.currentTime + when, len = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  env(g, t, 0.003, vol, dur); s.connect(f).connect(g).connect(c.destination); s.start(t);
}
const SFX = {
  clink(when = 0) {
    const base = 2600 + Math.random() * 500;
    [1, 1.52, 2.13, 2.9].forEach((m, i) => tone(base * m, 'sine', 0.25 - i * 0.04, 0.12 / (i + 1), when));
    noise(0.03, 0.08, when, 6000, 2);
  },
  insert() {
    this.clink();
    for (let i = 0; i < 6; i++) noise(0.018, 0.05 * (1 - i / 7), 0.08 + i * 0.045, 3500 - i * 300, 3);
    tone(180, 'triangle', 0.12, 0.18, 0.42, 90);
    noise(0.05, 0.1, 0.42, 500, 1);
  },
  reject() {
    this.clink();
    for (let i = 0; i < 4; i++) noise(0.02, 0.05, 0.1 + i * 0.05, 2500, 3);
    this.clink(0.35);
  },
  beep() { tone(1500, 'square', 0.07, 0.05); },
  error() { tone(330, 'square', 0.12, 0.05); tone(260, 'square', 0.16, 0.05, 0.15); },
  motor() {
    const c = ac(), t = c.currentTime, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    const lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = 85; f.type = 'lowpass'; f.frequency.value = 700;
    lfo.frequency.value = 14; lg.gain.value = 0.03; lfo.connect(lg).connect(g.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.1);
    g.gain.setValueAtTime(0.09, t + 1.0); g.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    o.connect(f).connect(g).connect(c.destination); o.start(t); lfo.start(t); o.stop(t + 1.25); lfo.stop(t + 1.25);
    noise(0.08, 0.12, 0.95, 900, 1);
  },
  thud() { tone(120, 'sine', 0.28, 0.35, 0, 45); noise(0.12, 0.2, 0, 300, 0.8); tone(95, 'sine', 0.18, 0.15, 0.2, 50); },
  cascade(n) { for (let i = 0; i < Math.min(n, 12); i++) this.clink(i * 0.07 + Math.random() * 0.03); },
  plastic(when = 0) { noise(0.025, 0.12, when, 3200, 2); tone(700, 'triangle', 0.05, 0.05, when); },
  cupdrop() { this.plastic(); this.plastic(0.12); tone(420, 'triangle', 0.08, 0.06, 0.12); },
  lid() { noise(0.02, 0.15, 0, 4000, 3); tone(1200, 'square', 0.03, 0.04, 0.01); },
  brew(ms) {
    // silbido de vapor + goteo
    const c = ac(), t = c.currentTime, dur = ms / 1000;
    const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = b; f.type = 'highpass'; f.frequency.value = 3500;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.4);
    g.gain.setValueAtTime(0.05, t + dur - 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination); src.start(t);
    for (let x = 0.5; x < dur - 0.3; x += 0.12 + Math.random() * 0.2) tone(500 + Math.random() * 400, 'sine', 0.05, 0.05, x, 200);
    this.motor();
  },
  // sonido continuo mientras se sirve: devuelve función para detenerlo
  loop(kind) {
    const c = ac(), t = c.currentTime;
    const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = b; src.loop = true;
    const f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    if (kind === 'slush') { f.type = 'lowpass'; f.frequency.value = 450; lfo.frequency.value = 5; }
    else if (kind === 'waste') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .8; lfo.frequency.value = 11; }
    else { f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = .7; lfo.frequency.value = 9; }
    lfo.connect(lg).connect(g.gain); lg.gain.value = 0.03;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(kind === 'slush' ? 0.16 : 0.1, t + 0.08);
    src.connect(f).connect(g).connect(c.destination); src.start(t); lfo.start(t);
    let fizz = kind === 'fountain' ? setInterval(() => tone(2500 + Math.random() * 3000, 'sine', 0.02, 0.015), 45) : null;
    return () => { const n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0.0001, n + 0.12); src.stop(n + 0.15); lfo.stop(n + 0.15); if (fizz) clearInterval(fizz); };
  },
  iceLoop() {
    const id = setInterval(() => { this.clink(); noise(0.03, 0.08, 0, 2500, 2); }, 90);
    return () => clearInterval(id);
  },
  splash() { noise(0.25, 0.12, 0, 700, 0.6); },
  key() { tone(1900, 'square', 0.04, 0.035); noise(0.015, 0.05, 0, 5000, 2); },
  ok() { tone(880, 'sine', 0.09, 0.07); tone(1320, 'sine', 0.12, 0.06, 0.08); },
  ding() { [1568, 2093].forEach((f, i) => tone(f, 'sine', 0.5, 0.06, i * 0.12)); },
  stamp() { tone(140, 'sine', 0.18, 0.25, 0, 60); noise(0.06, 0.15, 0, 900, 1); },
};

/* ---------------- MONEDA DE Q1 (SVG) ---------------- */
const RELIEF = 'fill="#b3b8be" stroke="#767c83" stroke-width=".6"';

function rim() {
  return `<circle r="99" fill="url(#kvRim)"/>
    <circle r="97.3" fill="none" stroke="#5f656c" stroke-width="3.4" stroke-dasharray="1 1.35" opacity=".55"/>
    <circle r="91.5" fill="url(#kvField)" stroke="#7d838a" stroke-width="1.4"/>
    <circle r="89" fill="none" stroke="#fff" stroke-width=".7" opacity=".45"/>`;
}

function laurel(radius, from, to, count, cy = 0) {
  let out = '';
  for (let side of [-1, 1]) {
    let path = '';
    for (let i = 0; i <= count; i++) {
      const a = (from + (to - from) * (i / count)) * Math.PI / 180;
      const x = Math.cos(a) * radius * side, y = Math.sin(a) * radius + cy;
      path += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      const tang = (a * 180 / Math.PI + 90) * (side === -1 ? -1 : 1);
      const rot = side === -1 ? 180 - tang : tang;
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.2" ry="2.5" transform="rotate(${(rot + 35 * side).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${4 * side} -1)" ${RELIEF}/>`;
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.2" ry="2.5" transform="rotate(${(rot - 35 * side).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${4 * side} 1)" ${RELIEF}/>`;
    }
    out = `<path d="${path}" fill="none" stroke="#767c83" stroke-width="1.3"/>` + out;
  }
  return out;
}

function coinFront(year = '2016') {
  return `<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">${rim()}
  <g filter="url(#kvEmboss)">
    <text ${RELIEF} font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="13.5" letter-spacing="1.6">
      <textPath href="#kvArcTop" startOffset="50%" text-anchor="middle">REPÚBLICA DE GUATEMALA</textPath></text>
    <text ${RELIEF} font-family="Georgia, serif" font-weight="700" font-size="12" letter-spacing="2">
      <textPath href="#kvArcBot" startOffset="50%" text-anchor="middle">${year}</textPath></text>
    <g transform="translate(0 6) scale(.92)">
      ${laurel(52, 95, 250, 9)}
      <!-- espadas cruzadas -->
      <g stroke="#767c83" stroke-width="1" fill="#b3b8be">
        <path d="M-46 -38 L40 40 L42 38 L-44 -40 Z"/><path d="M46 -38 L-40 40 L-42 38 L44 -40 Z"/>
        <rect x="-50" y="-44" width="10" height="3" transform="rotate(42 -45 -42)"/><rect x="40" y="-44" width="10" height="3" transform="rotate(-42 45 -42)"/>
      </g>
      <!-- rifles cruzados con bayoneta -->
      <g stroke="#767c83" stroke-width=".8" fill="#b3b8be">
        <path d="M-36 -46 L-33 -48 L38 44 L42 52 L34 50 Z"/><path d="M36 -46 L33 -48 L-38 44 L-42 52 L-34 50 Z"/>
        <path d="M-38 -48 L-44 -60 L-35 -50 Z"/><path d="M38 -48 L44 -60 L35 -50 Z"/>
      </g>
      <!-- cola del quetzal -->
      <g transform="translate(0 4) scale(1.3)">
      <path d="M-2 -16 C-20 -14 -36 0 -40 26 C-36 8 -24 -4 -6 -10 Z" ${RELIEF}/>
      <path d="M-1 -12 C-16 -6 -26 10 -28 30 C-22 14 -14 2 0 -6 Z" ${RELIEF}/>
      <path d="M0 -10 C-10 -2 -16 12 -16 26 C-12 12 -6 2 2 -6 Z" ${RELIEF}/>
      </g>
      <!-- pergamino -->
      <path d="M-28 -6 H28 Q33 -6 33 -1 Q33 3 28 3 V26 Q33 26 33 30 Q33 34 28 34 H-28 Q-33 34 -33 30 Q-33 26 -28 26 V3 Q-33 3 -33 -1 Q-33 -6 -28 -6 Z" ${RELIEF}/>
      <g fill="#6f757c" font-family="Georgia, serif" text-anchor="middle" font-weight="700">
        <text y="6" font-size="6.6" letter-spacing=".6">LIBERTAD</text>
        <text y="13.5" font-size="4.3">15 DE</text>
        <text y="19.5" font-size="4.3">SEPTIEMBRE</text>
        <text y="25.5" font-size="4.3">DE 1821</text>
      </g>
      <!-- quetzal -->
      <g transform="translate(0 4) scale(1.3)">
      <path d="M-4 -8 C-6 -20 4 -28 13 -25 C20 -22 20 -12 12 -8 Z" ${RELIEF}/>
      <circle cx="14" cy="-28" r="5.2" ${RELIEF}/>
      <path d="M11 -32 L13 -38 L15 -33 L18 -37 L18 -31 Z" ${RELIEF}/>
      <path d="M19 -29 L24 -27 L19 -26 Z" fill="#8a9097"/>
      <circle cx="15.5" cy="-28.8" r=".9" fill="#50555b"/>
      <path d="M0 -18 C6 -22 12 -18 13 -12 C8 -14 4 -13 0 -12 Z" fill="#9ca2a8" stroke="#767c83" stroke-width=".5"/>
      </g>
    </g>
  </g>
  <circle r="99" fill="url(#kvShine)"/>
  </svg>`;
}

function coinBack() {
  return `<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">${rim()}
  <g filter="url(#kvEmboss)">
    <text ${RELIEF} font-family="Georgia, serif" font-weight="700" font-size="15" letter-spacing="3">
      <textPath href="#kvArcTop" startOffset="50%" text-anchor="middle">UN QUETZAL</textPath></text>
    ${laurel(70, 115, 160, 4, 0)}
    <text x="4" y="40" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="104" ${RELIEF} stroke-width="1.2">1</text>
    <!-- paloma -->
    <g transform="translate(-40 -16) scale(.9)">
      <path d="M-14 6 C-4 -2 10 -2 18 4 C12 8 2 12 -8 12 Z" ${RELIEF}/>
      <path d="M-2 2 C-6 -12 2 -24 16 -28 C10 -18 12 -8 8 2 Z" ${RELIEF}/>
      <circle cx="20" cy="3" r="3.2" ${RELIEF}/>
      <path d="M23 2 L28 3.5 L23 5 Z" fill="#8a9097"/>
      <path d="M-14 6 L-24 2 L-22 10 L-12 10 Z" ${RELIEF}/>
    </g>
    <text ${RELIEF} font-family="Georgia, serif" font-weight="700" font-size="11" letter-spacing="3">
      <textPath href="#kvArcBot" startOffset="50%" text-anchor="middle">PAZ</textPath></text>
  </g>
  <circle r="99" fill="url(#kvShine)"/>
  </svg>`;
}

const FRONT = () => COIN_IMAGES ? `<img src="${COIN_IMAGES.front}" style="width:100%;height:100%">` : coinFront();
const BACK  = () => COIN_IMAGES ? `<img src="${COIN_IMAGES.back}" style="width:100%;height:100%">` : coinBack();

function makeCoin(size = 76) {
  const el = document.createElement('div');
  el.className = 'coin';
  el.style.width = el.style.height = size + 'px';
  let layers = '';
  for (let i = 1; i <= 5; i++) layers += `<div class="layer" style="transform:translateZ(${i}px)"></div>`;
  el.innerHTML = `<div class="inner"><div class="face back">${BACK()}</div>${layers}<div class="face front" style="transform:translateZ(6px)">${FRONT()}</div></div>`;
  // corregir orden: el anverso queda al frente (Z mayor) y reverso detrás
  el.querySelector('.back').style.transform = 'rotateY(180deg)';
  return el;
}

/* ---------------- UI helpers ---------------- */
function money(n) { return `${S.symbol} ${Number(n).toFixed(2)}`; }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

let lcdTimer;
function lcd(top, main, opts = {}) {
  clearTimeout(lcdTimer);
  const box = $('lcd');
  box.classList.remove('blink', 'err'); void box.offsetWidth;
  if (opts.blink) box.classList.add('blink');
  if (opts.err) box.classList.add('err');
  $('lcdTop').textContent = top;
  $('lcdTop').parentElement.classList.toggle('marquee', !!opts.marquee);
  $('lcdMain').textContent = main;
  if (opts.revert) lcdTimer = setTimeout(idleLcd, opts.revert);
}
function idleLcd() {
  if (S.credit > 0) return lcd('CRÉDITO', money(S.credit));
  lcd(S.type === 'coffee' ? 'BIENVENIDO · INSERTE MONEDAS DE Q1 · ELIJA SU BEBIDA ·' : 'BIENVENIDO · INSERTE MONEDAS DE Q1 · MARQUE SU CÓDIGO ·', money(0), { marquee: true });
}

let toastT;
function toast(msg, type = '') {
  const t = $('toast'); t.className = 'toast show ' + type; $('toastTxt').textContent = msg;
  clearTimeout(toastT); toastT = setTimeout(() => t.className = 'toast ' + type, 3400);
}
function shake() { const p = $('machine'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); }

async function post(name, data = {}) {
  if (!IN_GAME) return (window.mockPost || mock)(name, data);
  try {
    const r = await fetch(`https://${RES}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(data) });
    return await r.json();
  } catch (e) { return { ok: false }; }
}

function shade(hex, amt) {
  let c = String(hex || '#888').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16) || 0; const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function rgb(hex) { let c = String(hex || '#888').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const n = parseInt(c, 16) || 0; return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgba(hex, a) { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; }
function isLight(hex) { const [r, g, b] = rgb(hex); return (r * 0.299 + g * 0.587 + b * 0.114) > 175; }
function setBrand(col) {
  const root = document.documentElement.style;
  root.setProperty('--brand', col); root.setProperty('--brand-l', shade(col, .35)); root.setProperty('--brand-d', shade(col, -.45));
  root.setProperty('--brand-rgb', rgb(col).join(','));
}
function logoClass(style) { return 'logo-' + (['script', 'bold', 'retro', 'clean'].includes(style) ? style : 'script'); }

/* escala según la pantalla */
function fit() {
  let s = Math.max(.6, Math.min(1.6, innerHeight / 1000));
  const main = !$('dispScreen').classList.contains('hidden') ? $('dispWrap') : $('machine');
  if (main && main.offsetHeight) s = Math.min(s, (innerHeight * .92) / main.offsetHeight);
  if (main && main.offsetWidth) s = Math.min(s, (innerWidth * .62) / main.offsetWidth);
  document.documentElement.style.setProperty('--s', s.toFixed(3));
}
window.addEventListener('resize', fit);

/* ---------------- productos dibujados ---------------- */
function productHTML(p, extra = '') {
  const c = p.color || '#888';
  const shape = ['can', 'bottle', 'snack', 'cup'].includes(p.shape) ? p.shape : 'can';
  const name = esc(p.label || '');
  const light = isLight(c) ? ' light' : '';
  if (shape === 'bottle') return `<div class="pr bottle ${extra}" style="--c:${c}"><i class="cap"></i><i class="body"></i><i class="label"><b>${name}</b></i></div>`;
  if (shape === 'snack') return `<div class="pr snack ${extra}" style="--c:${c}"><i class="body"><b>${name}</b></i></div>`;
  if (shape === 'cup') return `<div class="pr cup ${extra}" style="--c:${c}"><i class="lid"></i><i class="body"></i></div>`;
  return `<div class="pr can${light} ${extra}" style="--c:${c}"><i class="top"></i><i class="body"><b>${name}</b></i><i class="bottom"></i></div>`;
}
const COIL = `<svg class="coil" viewBox="0 0 80 28" aria-hidden="true">
  <path class="back" d="M18 8 A22 5 0 0 0 62 8"/>
  <path class="back" d="M12 11 A28 7 0 0 0 68 11"/>
  <path d="M5 13 A35 10 0 0 0 75 13"/></svg>`;

/* =====================================================================
   VENDING
   ===================================================================== */
const ROWS = 'ABCDEFGH';
function codeOf(i) { return ROWS[Math.floor(i / S.cols)] + ((i % S.cols) + 1); }
function indexOfCode(code) {
  const r = ROWS.indexOf(code[0]), c = parseInt(code.slice(1), 10) - 1;
  if (r < 0 || isNaN(c) || c < 0 || c >= S.cols) return -1;
  const i = r * S.cols + c;
  return i < S.products.length ? i : -1;
}

function renderShelves() {
  const n = S.products.length;
  S.cols = n <= 1 ? 1 : (n === 2 || n === 4) ? 2 : n > 9 ? 4 : 3;
  const box = $('shelves'); box.innerHTML = ''; box.style.setProperty('--cols', S.cols);
  box.classList.toggle('big', n <= S.cols);
  S.products.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'slotx'; el.dataset.i = i;
    el.innerHTML = `<div class="name-pop">${esc(p.label)} · ${S.symbol}${p.price}</div>
      <div class="stack">${productHTML(p, 'b2')}${productHTML(p, 'b1')}${productHTML(p, 'f')}</div>
      ${COIL}
      <div class="shelf"><span class="code">${codeOf(i)}</span><span class="tag">${S.symbol}${p.price}</span><i class="led"></i></div>`;
    el.addEventListener('click', () => { if (S.busy) return; SFX.key(); S.code = codeOf(i); select(i + 1); });
    box.appendChild(el);
  });
  renderKeypad();
  updateLeds();
}

function renderKeypad() {
  const kp = $('keypad'); kp.innerHTML = '';
  const rows = Math.ceil(S.products.length / S.cols);
  const keys = ['A', 'B', 'C', 'D', '1', '2', '3', '4'];
  keys.forEach((k) => {
    const b = document.createElement('button'); b.className = 'key'; b.textContent = k;
    const isRow = /[A-D]/.test(k);
    if ((isRow && ROWS.indexOf(k) >= rows) || (!isRow && +k > S.cols)) b.classList.add('off');
    b.addEventListener('click', () => typeKey(k));
    kp.appendChild(b);
  });
  const clr = document.createElement('button'); clr.className = 'key wide clr'; clr.textContent = 'BORRAR'; clr.addEventListener('click', () => typeKey('CLR'));
  const ok = document.createElement('button'); ok.className = 'key wide ok'; ok.textContent = 'OK'; ok.addEventListener('click', () => typeKey('OK'));
  kp.append(clr, ok);
}

function typeKey(k) {
  if (S.busy) return;
  ac(); SFX.key();
  if (k === 'CLR') { S.code = ''; markSel(-1); idleLcd(); return; }
  if (k === 'OK') {
    const i = indexOfCode(S.code);
    if (i < 0) { SFX.error(); lcd('CÓDIGO INVÁLIDO', S.code || '--', { err: true, revert: 1400 }); S.code = ''; return; }
    return select(i + 1);
  }
  if (/[A-H]/.test(k)) S.code = k;
  else if (S.code.length === 1) S.code += k;
  else S.code = '';
  const i = indexOfCode(S.code);
  markSel(i);
  if (i >= 0) { const p = S.products[i]; lcd(`${S.code} ${p.label.toUpperCase()}`, money(p.price)); }
  else lcd('CÓDIGO', (S.code || '') + '_');
}

function markSel(i) { document.querySelectorAll('.slotx').forEach((s) => s.classList.toggle('sel', +s.dataset.i === i)); }

function updateLeds() {
  document.querySelectorAll('.slotx').forEach((b) => b.classList.toggle('ready', S.credit >= S.products[b.dataset.i].price));
  document.querySelectorAll('.drink').forEach((b) => b.classList.toggle('ready', S.credit >= S.products[b.dataset.i].price));
  const bb = $('brewBtn');
  if (bb) bb.classList.toggle('armed', S.type === 'coffee' && S.sel != null && S.credit >= (S.products[S.sel] || {}).price && !S.busy);
}

/* animación de la vitrina (cuando el juego avisa 'motor') */
function animateVend() {
  const i = S.pending; if (i == null) return;
  const slot = document.querySelector(`.slotx[data-i="${i}"]`); if (!slot) return;
  const p = S.products[i];
  slot.classList.add('spin');
  setTimeout(() => { const f = slot.querySelector('.pr.f'); if (f) f.classList.add('falling'); }, 650);
  setTimeout(() => {
    slot.classList.remove('spin');
    $('bayIn').innerHTML = productHTML(p);
    $('mBay').classList.add('bump'); setTimeout(() => $('mBay').classList.remove('bump'), 260);
  }, 1300);
  setTimeout(() => { const f = slot.querySelector('.pr.f'); if (f) { f.classList.remove('falling'); f.style.opacity = 0; requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 1; }); } }, 2200);
}

/* =====================================================================
   CAFÉ
   ===================================================================== */
const SUGAR_TXT = ['SIN AZÚCAR', 'POCA', 'NORMAL', 'DULCE', 'MUY DULCE', 'EXTRA'];
function renderMenu() {
  const box = $('cMenu'); box.innerHTML = '';
  S.products.forEach((p, i) => {
    const el = document.createElement('div'); el.className = 'drink'; el.dataset.i = i;
    el.innerHTML = `<div class="mug"><i style="--c:${p.color}"></i></div><div class="info"><div class="nm">${esc(p.label)}</div><div class="pc">${S.symbol}${p.price}</div></div><i class="led"></i>`;
    el.addEventListener('click', () => {
      if (S.busy) return; ac(); SFX.key();
      S.sel = i; document.querySelectorAll('.drink').forEach((d) => d.classList.toggle('sel', d === el));
      lcd(p.label.toUpperCase(), money(p.price));
      $('brewStatus').textContent = S.credit >= p.price ? 'PRESIONE PREPARAR' : `FALTAN ${S.symbol}${p.price - S.credit}`;
      updateLeds();
    });
    box.appendChild(el);
  });
}
function renderSugar() {
  document.querySelectorAll('#sugarCubes i').forEach((c, i) => c.classList.toggle('on', i < S.sugar));
  $('sugarTxt').textContent = SUGAR_TXT[S.sugar];
}
function setSugar(v) { if (S.busy) return; ac(); S.sugar = Math.max(0, Math.min(5, v)); SFX.beep(); renderSugar(); }
$('sugarMinus').addEventListener('click', () => setSugar(S.sugar - 1));
$('sugarPlus').addEventListener('click', () => setSugar(S.sugar + 1));
document.querySelectorAll('#sugarCubes i').forEach((c, i) => c.addEventListener('click', () => setSugar(S.sugar === i + 1 ? i : i + 1)));
$('brewBtn').addEventListener('click', () => {
  if (S.busy) return; ac();
  if (S.sel == null) { SFX.error(); shake(); lcd('ELIJA UNA', 'BEBIDA', { blink: true, revert: 1500 }); return; }
  select(S.sel + 1);
});

let brewTimer;
function resetBrew() {
  clearInterval(brewTimer);
  const cup = $('ccup'); cup.className = 'ccup'; $('ccupLiq').style.transition = 'none'; $('ccupLiq').style.height = '0'; $('ccupLiq').style.opacity = 0;
  $('ccupFoam').classList.remove('on'); $('ccupCubes').innerHTML = '';
  $('brewStream').classList.remove('on'); $('steam').classList.remove('on');
  const ring = $('brewRing'); ring.style.transition = 'none'; ring.style.strokeDashoffset = 276.5;
  $('brewBtnTxt').textContent = 'PREPARAR';
  $('brewStatus').textContent = 'ELIJA SU BEBIDA';
}
function startBrew(ms) {
  const p = S.products[S.pending] || {};
  const col = p.color || '#3b2314';
  document.documentElement.style.setProperty('--drink', col);
  const cup = $('ccup'); cup.classList.add('in', 'see');
  // azúcar
  const cubes = $('ccupCubes');
  for (let k = 0; k < S.sugar; k++) { const c = document.createElement('i'); c.style.left = (14 + k * 6) + 'px'; c.style.animationDelay = (k * 0.12) + 's'; cubes.appendChild(c); }
  $('brewStream').classList.add('on');
  setTimeout(() => $('steam').classList.add('on'), 600);
  const liq = $('ccupLiq');
  liq.style.opacity = 1; liq.style.transition = `height ${ms * 0.92}ms cubic-bezier(.3,.1,.5,1)`;
  requestAnimationFrame(() => requestAnimationFrame(() => liq.style.height = '84%'));
  if (/capu|cappu|latte|leche|moca|mocha|chocolate/i.test(p.label || '')) setTimeout(() => $('ccupFoam').classList.add('on'), ms * 0.6);
  const ring = $('brewRing'); ring.style.transition = 'none'; ring.style.strokeDashoffset = 276.5;
  requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.transition = `stroke-dashoffset ${ms}ms linear`; ring.style.strokeDashoffset = 0; }));
  const t0 = performance.now();
  clearInterval(brewTimer);
  brewTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    $('brewBtnTxt').textContent = Math.round(k * 100) + '%';
    lcd('PREPARANDO', Math.round(k * 100) + ' %');
    $('brewStatus').textContent = k < .15 ? 'MOLIENDO...' : k < .85 ? 'SIRVIENDO...' : 'CASI LISTO...';
    if (k >= 1) clearInterval(brewTimer);
  }, 120);
  brewBar(ms);
}
function brewBar(ms) {
  const wrap = $('lcdBarWrap'), bar = $('lcdBar');
  wrap.classList.remove('hidden');
  bar.style.transition = 'none'; bar.style.width = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${ms}ms linear`; bar.style.width = '100%'; }));
  setTimeout(() => wrap.classList.add('hidden'), ms + 400);
}

/* =====================================================================
   MONEDAS
   ===================================================================== */
function seeded(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

function renderPocket(animate) {
  const box = $('coins'); box.innerHTML = '';
  $('pocketCount').textContent = `×${S.coins}`;
  if (S.coins <= 0) { box.innerHTML = `<div class="empty-msg">No tienes monedas de Q1<small>Necesitas efectivo para usar la máquina</small></div>`; return; }
  const n = Math.min(S.coins, 14);
  for (let i = 0; i < n; i++) {
    const c = makeCoin(70);
    const col = i % 7, row = Math.floor(i / 7);
    const rest = `rotateZ(${Math.floor(seeded(i + 3) * 360)}deg)`;
    c.style.left = (6 + col * 49 + seeded(i) * 8) + 'px';
    c.style.top = (8 + row * 62 + seeded(i + 7) * 10) + 'px';
    c.style.zIndex = 10 + row * 10 + col;
    if (animate) { c.classList.add('drop-in'); c.style.animationDelay = (i * 25) + 'ms'; }
    c.querySelector('.inner').style.transform = rest;
    c.addEventListener('mouseenter', () => { if (!drag) c.querySelector('.inner').style.transform = 'rotateY(180deg)'; });
    c.addEventListener('mouseleave', () => { c.querySelector('.inner').style.transform = rest; });
    c.addEventListener('pointerdown', (e) => startDrag(e, c));
    c.addEventListener('dblclick', () => quickInsert(c));
    box.appendChild(c);
  }
}

/* arrastrar moneda */
let drag = null, pending = null;
function startDrag(e, coinEl) {
  if (S.busy || e.button !== 0) return;
  ac();
  pending = { coinEl, x: e.clientX, y: e.clientY }; // se vuelve arrastre al moverse 6px
}
function beginDrag(e) {
  const coinEl = pending.coinEl; pending = null;
  const r = coinEl.getBoundingClientRect();
  const fly = makeCoin(r.width); fly.classList.add('fly');
  fly.style.left = r.left + 'px'; fly.style.top = r.top + 'px';
  document.body.appendChild(fly);
  coinEl.style.visibility = 'hidden';
  drag = { fly, src: coinEl, dx: e.clientX - r.left, dy: e.clientY - r.top, size: r.width };
  SFX.clink();
}
window.addEventListener('pointermove', (e) => {
  if (cupDrag) return moveCup(e);
  if (pending && Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > 6) beginDrag(e);
  if (!drag) return;
  const x = e.clientX - drag.dx, y = e.clientY - drag.dy;
  drag.fly.style.left = x + 'px'; drag.fly.style.top = y + 'px';
  const tilt = Math.max(-35, Math.min(35, e.movementX * 3));
  drag.fly.querySelector('.inner').style.transform = `rotateY(${tilt}deg) rotateX(${-e.movementY * 2}deg)`;
  $('slot').classList.toggle('hot', overSlot(e.clientX, e.clientY));
});
window.addEventListener('pointerup', (e) => {
  pending = null;
  stopPour();
  if (cupDrag) return dropCup();
  if (!drag) return;
  const d = drag; drag = null;
  $('slot').classList.remove('hot');
  if (overSlot(e.clientX, e.clientY)) insert(d.fly, d.size);
  else returnToPocket(d.fly, d.src);
});
function overSlot(x, y) {
  const r = $('slot').getBoundingClientRect(), pad = 34;
  return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
}
function returnToPocket(fly, src) {
  const r = src.getBoundingClientRect();
  fly.style.transition = 'left .3s ease, top .3s ease';
  fly.style.left = r.left + 'px'; fly.style.top = r.top + 'px';
  setTimeout(() => { fly.remove(); src.style.visibility = ''; }, 320);
}
function quickInsert(coinEl) {
  if (S.busy) return;
  ac();
  const r = coinEl.getBoundingClientRect();
  const fly = makeCoin(r.width); fly.classList.add('fly');
  fly.style.left = r.left + 'px'; fly.style.top = r.top + 'px';
  document.body.appendChild(fly); coinEl.style.visibility = 'hidden';
  requestAnimationFrame(() => insert(fly, r.width));
}

async function insert(fly, size = 70) {
  if (S.busy) { fly.remove(); renderPocket(); return; }
  S.busy = true;
  const hole = document.querySelector('.slot-hole').getBoundingClientRect();
  const inner = fly.querySelector('.inner');
  fly.style.transition = 'left .28s ease, top .28s ease';
  inner.style.transition = 'transform .28s ease';
  fly.style.left = (hole.left + hole.width / 2 - size / 2) + 'px';
  fly.style.top = (hole.top - size / 2 + 6) + 'px';
  inner.style.transform = 'rotateY(84deg)';
  const req = post('insertCoin');
  await wait(300);
  fly.style.transition = 'top .25s ease-in, opacity .25s ease-in';
  inner.style.transition = 'transform .25s ease-in';
  fly.style.top = (hole.top + 10) + 'px';
  inner.style.transform = 'rotateY(90deg) translateZ(-40px) scale(.7)';
  fly.style.opacity = '0';
  const r = await req;
  await wait(220);
  fly.remove();

  if (r && r.ok) {
    SFX.insert();
    S.credit = r.credit; if (typeof r.coins === 'number') S.coins = r.coins;
    lcd('CRÉDITO', money(S.credit));
    if (S.type === 'coffee' && S.sel != null) {
      const p = S.products[S.sel];
      $('brewStatus').textContent = S.credit >= p.price ? 'PRESIONE PREPARAR' : `FALTAN ${S.symbol}${p.price - S.credit}`;
    }
    updateLeds();
  } else {
    SFX.reject();
    if (r && typeof r.coins === 'number') S.coins = r.coins;
    dropInCup(1);
    if (r && r.reason === 'full') lcd('CRÉDITO MÁXIMO', money(S.credit), { blink: true, err: true, revert: 1800 });
    else if (r && r.reason === 'nomoney') { lcd('SIN MONEDAS', money(S.credit), { err: true, revert: 1800 }); toast('No tienes suficiente efectivo para otra moneda de Q1.', 'err'); }
    else lcd('MONEDA RECHAZADA', money(S.credit), { err: true, revert: 1500 });
  }
  renderPocket();
  await wait(150);
  S.busy = false;
  updateLeds();
}

function dropInCup(n) {
  const cup = $('cupHole'); cup.innerHTML = '';
  for (let i = 0; i < Math.min(n, 10); i++) {
    const c = document.createElement('div'); c.className = 'cup-coin';
    c.innerHTML = FRONT();
    c.style.left = (10 + Math.random() * 70) + 'px'; c.style.top = '-30px';
    c.style.transform = `rotate(${Math.random() * 360}deg) scaleY(.55)`;
    c.style.transition = `top .35s cubic-bezier(.5,1.6,.6,1) ${i * 70}ms`;
    cup.appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => c.style.top = (12 + Math.random() * 10) + 'px'));
  }
  setTimeout(() => { cup.querySelectorAll('.cup-coin').forEach((c) => { c.style.transition = 'opacity .4s'; c.style.opacity = 0; }); }, 1600);
  setTimeout(() => cup.innerHTML = '', 2100);
}

/* ---------------- comprar ---------------- */
async function select(index) {
  if (S.busy) return;
  const p = S.products[index - 1]; if (!p) return;
  SFX.beep();
  S.busy = true;
  markSel(index - 1);
  const r = await post('select', { index, sugar: S.sugar });
  if (r && r.ok) {
    S.credit = r.credit; S.pending = index - 1; updateLeds();
    if (S.type === 'coffee') resetBrew(); else { $('bayIn').innerHTML = ''; $('bayIn').classList.remove('glow'); }
    SFX.ok();
    if (S.type === 'coffee') { lcd('PREPARANDO', p.label.toUpperCase().slice(0, 11)); $('brewStatus').textContent = 'PREPARANDO...'; }
    else lcd(`${codeOf(index - 1)} DESPACHANDO`, p.label.toUpperCase().slice(0, 11));
    // S.busy se libera cuando el juego avisa
  } else {
    S.busy = false;
    SFX.error(); shake();
    if (r && r.reason === 'credit') lcd(`${S.type === 'coffee' ? '' : codeOf(index - 1) + ' '}PRECIO`, money(p.price), { blink: true, revert: 1800 });
    else lcd('ESPERE...', money(S.credit), { revert: 1200 });
    S.code = '';
  }
}

async function refund() {
  if (S.busy) return;
  S.busy = true;
  const r = await post('refund');
  if (r && r.refunded > 0) {
    SFX.cascade(r.refunded); dropInCup(r.refunded);
    toast(`Te devolvió ${money(r.refunded)} en monedas.`, 'ok');
    S.credit = 0; if (typeof r.coins === 'number') S.coins = r.coins;
    await wait(700); renderPocket(true); idleLcd(); updateLeds();
  } else { SFX.beep(); lcd('SIN CRÉDITO', money(0), { revert: 1000 }); }
  S.busy = false;
}
$('returnBtn').addEventListener('click', refund);

/* =====================================================================
   DISPENSADOR: fuente de sodas / slush / jugos
   ===================================================================== */
const D = { taps: [], cups: [], style: 'fountain', cup: null, pouring: null, stopSnd: null, raf: 0, last: 0, wasteWarned: false, finishing: false };
const CUP_PX = (ml) => { const k = Math.max(0.8, Math.min(1.45, ml / 500)); return { w: Math.round(56 * k), h: Math.round(86 * k) }; };

function tapCenters() {
  const bay = $('dmBay').getBoundingClientRect();
  const s = bay.width / $('dmBay').offsetWidth || 1; // compensar la escala
  return [...document.querySelectorAll('.tap .nozzle')].map((n) => { const r = n.getBoundingClientRect(); return (r.left + r.width / 2 - bay.left) / s; });
}

function renderDispenser() {
  const dm = $('dm');
  dm.className = 'dm ' + D.style;
  dm.style.width = Math.max(360, D.taps.length * 100 + 44) + 'px';
  const brand = $('dmBrand'); brand.textContent = S.brand || ''; brand.className = logoClass(S.logo);
  $('dmSub').textContent = D.style === 'slush' ? 'FROZEN DRINKS' : D.style === 'juice' ? 'FRESH JUICE' : 'SELF SERVICE';

  const tanks = $('dmTanks'); tanks.innerHTML = '';
  if (D.style !== 'fountain') D.taps.forEach((t) => {
    const el = document.createElement('div'); el.className = 'tank'; el.style.setProperty('--c', t.color);
    el.innerHTML = `<div class="content"></div>${D.style === 'slush' ? '<div class="auger"></div>' : ''}<div class="shine"></div><div class="plate">${esc(t.label)}</div>`;
    tanks.appendChild(el);
  });

  const taps = $('dmTaps'); taps.innerHTML = '';
  const leverTxt = D.style === 'slush' ? 'PULL' : 'PUSH';
  D.taps.forEach((t, i) => {
    const el = document.createElement('div'); el.className = 'tap';
    el.innerHTML = `<div class="badge ${t.ice ? 'ice' : ''}" style="--c:${t.color};--cg:${rgba(t.color, .55)}">${esc(t.label)}</div><div class="nozzle"></div><div class="lever">${leverTxt}</div>`;
    const lever = el.querySelector('.lever');
    const start = (e) => { e.preventDefault(); startPour(i, lever); };
    lever.addEventListener('pointerdown', start);
    el.querySelector('.badge').addEventListener('pointerdown', start);
    taps.appendChild(el);
  });

  const streams = $('streams'); streams.innerHTML = '';
  D.taps.forEach((t) => { const s = document.createElement('div'); s.className = 'stream' + (t.ice ? ' ice' : ''); s.style.setProperty('--c', t.color); streams.appendChild(s); });

  const list = $('csList'); list.innerHTML = '';
  D.cups.forEach((c, i) => {
    const sz = CUP_PX(c.ml), mini = Math.round(sz.w * .55), minh = Math.round(sz.h * .55);
    const el = document.createElement('div'); el.className = 'cs-item';
    let stack = '';
    for (let k = 0; k < 3; k++) stack += `<div class="mini" style="top:${-k * 5}px;width:${mini}px;height:${minh}px"></div>`;
    el.innerHTML = `<div class="cs-stack" style="width:${mini}px;height:${minh + 10}px">${stack}</div><div class="cs-name">${esc(c.label)}</div><div class="cs-ml">${c.ml} ml</div><div class="cs-price">${S.symbol}${c.price}</div>`;
    el.addEventListener('click', () => takeCup(i));
    list.appendChild(el);
  });

  $('dCash').textContent = `${S.symbol} ${Math.floor(S.cash).toLocaleString('es-GT')}`;
  resetCup();
}

function resetCup() {
  if (D.cup && D.cup.el) D.cup.el.remove();
  document.querySelectorAll('.puddle, .stamp').forEach((p) => p.remove());
  D.cup = null; D.finishing = false;
  document.querySelectorAll('.cs-item').forEach((c) => c.classList.remove('disabled'));
  $('btnLid').disabled = true; $('btnLid').textContent = 'Tapar y llevar';
  $('dInfo').textContent = 'Agarra un vaso de la izquierda.';
  $('rating').classList.add('hidden');
  updateMeter();
}

function takeCup(i) {
  if (D.cup || D.finishing) return;
  ac(); SFX.plastic();
  const c = D.cups[i], sz = CUP_PX(c.ml);
  const el = document.createElement('div');
  el.className = 'pcup ' + D.style;
  el.style.width = sz.w + 'px'; el.style.height = sz.h + 'px';
  el.innerHTML = `<div class="straw"></div><div class="lid"></div><div class="pcup-body"><div class="liq"></div><div class="foam"></div><div class="cubes"></div><div class="gloss"></div></div><div class="rim"></div><div class="fill-line"></div><div class="spill"></div>`;
  $('dmBay').appendChild(el);
  const firstLiquid = Math.max(0, D.taps.findIndex((t) => !t.ice));
  D.cup = { el, size: i + 1, w: sz.w, h: sz.h, tap: firstLiquid, flavors: D.taps.map(() => 0), ice: 0, spill: 0 };
  placeCup(firstLiquid);
  el.addEventListener('pointerdown', (e) => { if (D.finishing) return; cupDrag = { x0: e.clientX, left0: parseFloat(el.style.left) }; el.classList.add('dragging'); });
  document.querySelectorAll('.cs-item').forEach((x) => x.classList.add('disabled'));
  $('btnLid').textContent = `Tapar y llevar · ${S.symbol}${c.price}`;
  $('dInfo').textContent = `Vaso ${c.label} listo. Ponlo debajo de una boquilla y mantén la palanca.`;
  updateMeter();
}

function placeCup(i) {
  const xs = tapCenters(); if (!D.cup) return;
  D.cup.tap = i;
  D.cup.el.style.left = (xs[i] - D.cup.w / 2) + 'px';
}

let cupDrag = null;
function moveCup(e) {
  const bayW = $('dmBay').offsetWidth;
  const s = $('dmBay').getBoundingClientRect().width / bayW || 1;
  const left = Math.max(4, Math.min(bayW - D.cup.w - 4, cupDrag.left0 + (e.clientX - cupDrag.x0) / s));
  D.cup.el.style.left = left + 'px';
  D.cup.tap = -1;
}
function dropCup() {
  const el = D.cup.el; el.classList.remove('dragging'); cupDrag = null;
  const center = parseFloat(el.style.left) + D.cup.w / 2;
  const xs = tapCenters();
  let best = 0; xs.forEach((x, i) => { if (Math.abs(x - center) < Math.abs(xs[best] - center)) best = i; });
  SFX.plastic();
  placeCup(best);
}

function level() {
  if (!D.cup) return 0;
  const liq = D.cup.flavors.reduce((a, b) => a + b, 0);
  return liq + D.cup.ice * 0.55;
}
function liquidColor() {
  const c = D.cup; let tot = 0, r = 0, g = 0, b = 0;
  D.taps.forEach((t, i) => { if (t.ice || !c.flavors[i]) return; const [R, G, B] = rgb(t.color); r += R * c.flavors[i]; g += G * c.flavors[i]; b += B * c.flavors[i]; tot += c.flavors[i]; });
  if (!tot) return 'transparent';
  return `rgb(${Math.round(r / tot)},${Math.round(g / tot)},${Math.round(b / tot)})`;
}

function updateMeter() {
  const c = D.cup;
  const lv = Math.min(100, level());
  const col = c ? liquidColor() : '#444';
  const liq = c ? c.flavors.reduce((a, b) => a + b, 0) : 0;
  $('meterFill').style.width = Math.min(100, liq) + '%';
  $('meterIce').style.left = Math.min(100, liq) + '%';
  $('meterIce').style.width = c ? Math.min(100 - Math.min(100, liq), c.ice * 0.55) + '%' : '0';
  document.documentElement.style.setProperty('--liq', col);
  $('meterTxt').textContent = c ? `${Math.round(lv)}%${c.ice > 5 ? ' · hielo' : ''}` : '—';
  if (!c) return;
  const el = c.el;
  el.querySelector('.liq').style.height = Math.min(100, lv) + '%';
  el.querySelector('.liq').style.backgroundColor = col;
  el.querySelector('.foam').style.bottom = `calc(${Math.min(100, lv)}% - 3px)`;
  // cubos de hielo flotando arriba del líquido
  const cubes = el.querySelector('.cubes');
  const n = Math.round(c.ice / 6);
  while (cubes.children.length < n) {
    const k = cubes.children.length, cube = document.createElement('div'); cube.className = 'cube';
    cube.style.left = (18 + seeded(k + 1) * 60) + '%'; cube.style.transform = `rotate(${seeded(k + 9) * 60 - 30}deg)`;
    cube.dataset.k = k; cubes.appendChild(cube);
  }
  [...cubes.children].forEach((cube) => {
    const k = +cube.dataset.k, top = Math.min(100, lv);
    const base = liq > 5 ? Math.max(0, top - 14 - (k % 3) * 7) : (Math.floor(k / 4) * 10);
    cube.style.bottom = base + '%';
  });
  $('btnLid').disabled = liq < 15 || D.finishing;
}

function startPour(i, lever) {
  if (D.pouring || D.finishing) return;
  ac();
  const tap = D.taps[i];
  lever.classList.add('down');
  const stream = $('streams').children[i];
  const xs = tapCenters();
  stream.style.left = xs[i] + 'px';
  const under = D.cup && D.cup.tap === i;
  const bayH = $('dmBay').offsetHeight;
  stream.style.height = (under ? bayH - 18 - D.cup.h * (Math.min(100, level()) / 100) : bayH - 20) + 'px';
  stream.classList.add('on');
  D.pouring = { i, lever, stream, tap };
  D.stopSnd = tap.ice ? SFX.iceLoop() : SFX.loop(under ? (D.style === 'slush' ? 'slush' : D.style) : 'waste');
  if (!under && !D.wasteWarned) { D.wasteWarned = true; toast('¡No hay vaso debajo! Se está tirando la bebida.', 'err'); }
  if (D.cup && under && !tap.ice && D.style === 'fountain') D.cup.el.querySelector('.foam').classList.add('on');
  D.last = performance.now();
  cancelAnimationFrame(D.raf); D.raf = requestAnimationFrame(pourTick);
}

function stopPour() {
  if (!D.pouring) return;
  D.pouring.lever.classList.remove('down');
  D.pouring.stream.classList.remove('on');
  if (D.stopSnd) D.stopSnd(); D.stopSnd = null;
  D.pouring = null;
  cancelAnimationFrame(D.raf);
  if (D.cup) setTimeout(() => D.cup && D.cup.el.querySelector('.foam').classList.remove('on'), 1500);
}

function pourTick(now) {
  if (!D.pouring) return;
  const dt = Math.min(0.05, (now - D.last) / 1000); D.last = now;
  const p = D.pouring, c = D.cup;
  if (c && c.tap === p.i) {
    const cupMl = D.cups[c.size - 1].ml;
    const lv = level();
    if (p.tap.ice) {
      if (lv < 100 && c.ice < 45) c.ice += dt * 28;
      else overflow(dt, true);
    } else {
      let rate = (100 / (cupMl / 160)) * (D.style === 'slush' ? 0.55 : 1);
      if (lv < 100) c.flavors[p.i] += Math.min(rate * dt, 100 - lv);
      else overflow(dt, false);
    }
    // el chorro se acorta mientras sube el nivel
    const bayH = $('dmBay').offsetHeight;
    p.stream.style.height = (bayH - 18 - c.h * Math.min(100, level()) / 100) + 'px';
    updateMeter();
  }
  D.raf = requestAnimationFrame(pourTick);
}

let spillWarned = false;
function overflow(dt, ice) {
  const c = D.cup;
  c.spill += dt;
  if (!c.el.classList.contains('spilling')) { c.el.classList.add('spilling'); SFX.splash(); }
  if (!spillWarned) { spillWarned = true; toast(ice ? 'El hielo se está saliendo del vaso.' : '¡Se te rebalsó el vaso!', 'err'); setTimeout(() => spillWarned = false, 4000); }
  if (!ice && Math.random() < dt * 4) {
    const pd = document.createElement('div'); pd.className = 'puddle';
    const left = parseFloat(c.el.style.left) - 10 + Math.random() * (c.w + 20);
    pd.style.left = left + 'px'; pd.style.width = (14 + Math.random() * 20) + 'px';
    $('dmBay').appendChild(pd);
  }
  clearTimeout(c.spillT); c.spillT = setTimeout(() => c.el.classList.remove('spilling'), 700);
}

function rateCup(c) {
  const lv = Math.min(100, level());
  if (c.spill > 0.35) return { txt: '¡REBALSADO!', col: '#ff6b5b' };
  if (lv >= 85) return { txt: '¡PERFECTO!', col: '#ffd23f' };
  if (lv >= 65) return { txt: 'BIEN SERVIDO', col: '#56f08a' };
  return { txt: 'LE FALTÓ...', col: '#ff9f43' };
}

$('btnTrash').addEventListener('click', () => { if (!D.cup || D.finishing) return; SFX.plastic(); SFX.splash(); resetCup(); });
$('btnLid').addEventListener('click', async () => {
  const c = D.cup; if (!c || D.finishing) return;
  D.finishing = true; $('btnLid').disabled = true;
  SFX.lid(); c.el.classList.add('closed');
  $('dInfo').textContent = 'Tapando...';
  const r = await post('dispFinish', { size: c.size, flavors: c.flavors.map((v) => Math.round(v)), ice: Math.round(c.ice), level: Math.round(Math.min(100, level())) });
  if (r && r.ok) {
    const rt = rateCup(c);
    const st = document.createElement('div'); st.className = 'stamp'; st.style.color = rt.col; st.textContent = rt.txt;
    $('dmBay').appendChild(st);
    const rb = $('rating'); rb.textContent = rt.txt; rb.style.color = rt.col; rb.classList.remove('hidden');
    setTimeout(() => SFX.stamp(), 200);
    if (rt.txt === '¡PERFECTO!') setTimeout(() => SFX.ding(), 450);
    $('dInfo').textContent = `¡Listo! ${r.label} ${r.size || ''}`;
    setTimeout(() => SFX.plastic(), 400);
  } else {
    D.finishing = false; c.el.classList.remove('closed'); updateMeter();
    SFX.error();
    const msg = r && r.reason === 'nomoney' ? 'No tienes suficiente efectivo.' : r && r.reason === 'full' ? 'No tienes espacio en el inventario.' : r && r.reason === 'empty' ? 'El vaso está casi vacío.' : 'No se pudo.';
    toast(msg, 'err'); $('dInfo').textContent = msg;
  }
});

/* ---------------- salir ---------------- */
async function close() {
  if (!S.open || (S.screen === 'vending' && S.busy) || D.finishing) return;
  stopPour();
  const r = await post('close');
  if (r && r.ok === false) return;
  if (r && r.refunded > 0) { SFX.cascade(r.refunded); dropInCup(r.refunded); toast(`Cambio devuelto: ${money(r.refunded)}`, 'ok'); }
  if (!IN_GAME) window.postMessage({ action: 'close' }, '*');
}
window.addEventListener('keydown', (e) => {
  if (window.KVCreator && window.KVCreator.isOpen()) return; // el creador maneja sus teclas
  if (e.key === 'Escape' || e.key === 'Backspace') return close();
  if (!S.open || S.screen !== 'vending' || S.type === 'coffee') return;
  const k = e.key.toUpperCase();
  if (/^[A-D1-4]$/.test(k)) typeKey(k);
  else if (e.key === 'Enter') typeKey('OK');
  else if (e.key === 'Delete') typeKey('CLR');
});

function copyText(text) {
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  ta.remove();
}

/* ---------------- mensajes del juego ---------------- */
window.addEventListener('message', (e) => {
  const d = e.data || {};
  switch (d.action) {
    case 'open': {
      S.open = true; S.busy = false; S.credit = 0; S.sugar = 2; S.code = ''; S.sel = null; S.pending = null;
      S.type = d.type; S.screen = d.screen; S.brand = d.brand; S.logo = d.logo;
      S.products = d.products || []; S.coins = d.coins || 0; S.cash = d.cash || 0; S.symbol = d.symbol || 'Q';
      setBrand(d.color || '#b3141c');
      const disp = d.screen === 'dispenser';
      $('vendScreen').classList.toggle('hidden', disp);
      $('dispScreen').classList.toggle('hidden', !disp);
      $('escTxt').textContent = disp ? 'Salir' : 'Salir y recoger el cambio';
      if (disp) {
        D.taps = d.taps || []; D.cups = d.cups || []; D.style = d.style || 'fountain'; D.wasteWarned = false;
        $('app').classList.remove('hidden');
        requestAnimationFrame(() => { renderDispenser(); fit(); });
      } else {
        const coffee = d.type === 'coffee';
        $('machine').classList.toggle('coffee', coffee);
        $('sugarRow').classList.toggle('on', !!d.sugar);
        const logo = $('brandName'); logo.textContent = d.brand || ''; logo.className = 'm-logo ' + logoClass(d.logo);
        $('brandTag').textContent = coffee ? 'CAFÉ RECIÉN HECHO' : (S.products.some((p) => p.shape === 'snack') && !S.products.some((p) => p.shape !== 'snack') ? 'SNACKS' : 'BEBIDAS FRÍAS');
        $('bayIn').innerHTML = ''; $('bayIn').classList.remove('glow');
        if (coffee) { renderMenu(); resetBrew(); } else renderShelves();
        renderPocket(true); renderSugar(); idleLcd(); updateLeds();
        $('app').classList.remove('hidden');
        requestAnimationFrame(fit);
      }
      break;
    }
    case 'close':
      S.open = false; stopPour(); $('app').classList.add('hidden');
      document.querySelectorAll('.fly').forEach((f) => f.remove());
      if (D.cup) resetCup();
      resetBrew();
      break;
    case 'motor': SFX.motor(); animateVend(); break;
    case 'thud': SFX.thud(); $('mBay').classList.add('bump'); setTimeout(() => $('mBay').classList.remove('bump'), 260); break;
    case 'cupdrop': SFX.cupdrop(); $('ccup').classList.add('in'); lcd('SIRVIENDO', '· · ·'); $('brewStatus').textContent = 'COLOCANDO VASO...'; break;
    case 'brew': SFX.brew(d.ms || 6000); startBrew(d.ms || 6000); break;
    case 'dispensed':
      if (d.mode === 'bay') {
        $('brewStream').classList.remove('on'); $('ccup').classList.add('ready'); $('ccup').classList.remove('see');
        $('brewBtnTxt').textContent = 'LISTO'; $('brewStatus').textContent = '¡LISTO! RETIRE SU BEBIDA';
        SFX.ding();
      } else $('bayIn').classList.add('glow');
      lcd('RETIRE SU', 'PRODUCTO');
      toast(d.mode === 'bay' ? `Tu ${d.label} está listo. Tómalo de la máquina.` : `Tu ${d.label} cayó abajo. Recógelo del suelo.`, 'ok');
      break;
    case 'change':
      if (d.refunded > 0) { SFX.cascade(d.refunded); dropInCup(d.refunded); lcd('SU CAMBIO', money(d.refunded)); }
      S.busy = false;
      break;
    case 'copy': copyText(d.text || ''); break;
  }
});

/* ---------------- MODO PRUEBA (abrir index.html en el navegador) ---------------- */
let mockCash = 9, mockCredit = 0;
async function mock(name, data) {
  await wait(120);
  if (name === 'insertCoin') {
    if (mockCredit >= 20) return { ok: false, reason: 'full', credit: mockCredit, coins: mockCash };
    if (mockCash < 1) return { ok: false, reason: 'nomoney', credit: mockCredit, coins: 0 };
    mockCash--; mockCredit++; return { ok: true, credit: mockCredit, coins: mockCash };
  }
  if (name === 'select') {
    const p = S.products[data.index - 1];
    if (mockCredit < p.price) return { ok: false, reason: 'credit', credit: mockCredit };
    mockCredit -= p.price;
    const coffee = S.type === 'coffee';
    const send = (m, t) => setTimeout(() => window.postMessage(m, '*'), t);
    if (coffee) { send({ action: 'cupdrop' }, 100); send({ action: 'brew', ms: 5000 }, 700); send({ action: 'dispensed', label: p.label, mode: 'bay' }, 5800); }
    else { send({ action: 'motor' }, 100); send({ action: 'thud' }, 1300); send({ action: 'dispensed', label: p.label }, 2500); }
    const n = mockCredit; mockCash += n; mockCredit = 0;
    send({ action: 'change', refunded: n }, coffee ? 5900 : 2600);
    return { ok: true, credit: 0 };
  }
  if (name === 'refund' || name === 'close') {
    const n = mockCredit; mockCash += n; mockCredit = 0;
    return { ok: true, refunded: n, coins: mockCash };
  }
  if (name === 'dispFinish') return { ok: true, label: 'eCola', size: 'Grande' };
  return { ok: true };
}
const DEMOS = {
  ecola: { screen: 'vending', type: 'vending', brand: 'eCola', logo: 'script', color: '#b3141c', products: [
    { label: 'eCola', price: 3, color: '#c8102e', shape: 'can' }, { label: 'eCola Light', price: 3, color: '#d9d9d9', shape: 'can' },
    { label: 'Sprunk', price: 3, color: '#1f9e3a', shape: 'can' }, { label: 'Orang-O-Tang', price: 3, color: '#f08a00', shape: 'can' },
    { label: 'Agua Pura', price: 2, color: '#3aa0ff', shape: 'bottle' }] },
  sprunk: { screen: 'vending', type: 'vending', brand: 'Sprunk', logo: 'bold', color: '#1b7f2e', products: [
    { label: 'Sprunk', price: 3, color: '#1f9e3a', shape: 'can' }, { label: 'Sprunk Light', price: 3, color: '#b8e986', shape: 'can' },
    { label: 'eCola', price: 3, color: '#c8102e', shape: 'can' }, { label: 'Orang-O-Tang', price: 3, color: '#f08a00', shape: 'can' },
    { label: 'Agua Pura', price: 2, color: '#3aa0ff', shape: 'bottle' }] },
  snacks: { screen: 'vending', type: 'vending', brand: 'Snacks', logo: 'retro', color: '#6b2a86', products: [
    { label: 'Ego Chaser', price: 4, color: '#ffb400', shape: 'snack' }, { label: 'Meteorite', price: 4, color: '#7a3b1d', shape: 'snack' },
    { label: "P's & Q's", price: 3, color: '#e04ba0', shape: 'snack' }] },
  cafe: { screen: 'vending', type: 'coffee', sugar: true, brand: 'Bean Machine', logo: 'clean', color: '#6b4226', products: [
    { label: 'Café Negro', price: 3, color: '#3b2314' }, { label: 'Café con Leche', price: 4, color: '#b07a4a' },
    { label: 'Capuchino', price: 5, color: '#d8b48a' }, { label: 'Chocolate', price: 4, color: '#5a2d0c' }, { label: 'Té Caliente', price: 3, color: '#a0522d' }] },
  fuente: { screen: 'dispenser', type: 'dispenser', style: 'fountain', brand: 'eCola', logo: 'script', color: '#c8102e', cash: 14022,
    cups: [{ label: 'Chico', price: 2, ml: 350 }, { label: 'Mediano', price: 3, ml: 500 }, { label: 'Grande', price: 4, ml: 750 }],
    taps: [{ label: 'Sprunk', color: '#1f9e3a' }, { label: 'eCola Light', color: '#b9b0a6' }, { label: 'HIELO', ice: true, color: '#cfeeff' }, { label: 'Orang-O-Tang', color: '#f08a00' }, { label: 'eCola', color: '#5a1a0e' }] },
  slush: { screen: 'dispenser', type: 'dispenser', style: 'slush', brand: 'Sludgie', logo: 'retro', color: '#1d6fb8', cash: 14022,
    cups: [{ label: 'Chico', price: 3, ml: 350 }, { label: 'Grande', price: 5, ml: 650 }],
    taps: [{ label: 'Lima-Limón', color: '#3fd07a' }, { label: 'Mora Azul', color: '#2f8cff' }] },
  jugos: { screen: 'dispenser', type: 'dispenser', style: 'juice', brand: 'Fresco', logo: 'bold', color: '#e0762b', cash: 14022,
    cups: [{ label: 'Chico', price: 2, ml: 350 }, { label: 'Grande', price: 4, ml: 650 }],
    taps: [{ label: 'Naranja', color: '#ffb319' }, { label: 'Fresa', color: '#ff7a52' }] },
};
if (!IN_GAME) {
  document.body.style.background = 'radial-gradient(circle at 30% 40%, #5a5e63, #1b1c1f)';
  const q = new URLSearchParams(location.search).get('m') || 'ecola';
  if (q !== 'creator') window.postMessage(Object.assign({ action: 'open', coins: mockCash, symbol: 'Q' }, DEMOS[q] || DEMOS.ecola), '*');
}
