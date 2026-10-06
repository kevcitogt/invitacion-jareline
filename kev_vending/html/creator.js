/* =========================================================
   kev_vending v3 - CREADOR DE MÁQUINAS (NUI)
   Usa helpers de app.js: post, esc, toast, shade, rgba, rgb, productHTML, logoClass, SFX
   ========================================================= */
(() => {
  const root = document.getElementById('creator');
  const C = {
    open: false, machines: [], placements: [], props: [], drops: [], symbol: 'Q', maxCredit: 20, info: {},
    items: null, itemsLoading: false, itemsWaiters: [], itemMap: {},
    cur: null, curId: null, tab: 'general', dirty: false, filter: '', idTouched: false, modelStatus: {},
  };
  window.KVCreator = { isOpen: () => C.open };

  /* ---------------- iconos ---------------- */
  const I = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
  const ICON = {
    search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    up: I('<path d="M6 15l6-6 6 6"/>'),
    down: I('<path d="M6 9l6 6 6-6"/>'),
    copy: I('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    map: I('<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>'),
    go: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    save: I('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h8M8 21v-7h8v7"/>'),
    reset: I('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
    vending: I('<rect x="5" y="2" width="14" height="20" rx="2"/><rect x="7.5" y="5" width="6.5" height="11" rx="1"/><path d="M16.5 6v2M16.5 10.5v1.5M7.5 19h9"/>'),
    coffee: I('<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2 2 0 0 1 0 4H16"/><path d="M8.5 2.5c0 1.5 1 1.5 1 3M12.5 2.5c0 1.5 1 1.5 1 3"/>'),
    fountain: I('<path d="M6 8h12l-1.6 13H7.6z"/><path d="M13.5 8l2-5.5H19"/><path d="M6.6 12.5h10.8"/>'),
    slush: I('<path d="M7 11h10l-1.3 10H8.3z"/><path d="M6 11a6 6 0 0 1 12 0"/><path d="M12 5V2"/>'),
    juice: I('<path d="M7.5 7h9l1 14h-11z"/><circle cx="16.5" cy="5" r="2.6"/><path d="M7.2 12h9.6"/>'),
    box: I('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'),
    item: I('<path d="M20 7l-8-4-8 4v10l8 4 8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>'),
  };

  const KINDS = [
    { k: 'vending', type: 'vending', label: 'Vending', desc: 'Latas, botellas o snacks que caen' },
    { k: 'coffee', type: 'coffee', label: 'Café', desc: 'Bebidas calientes con azúcar' },
    { k: 'fountain', type: 'dispenser', style: 'fountain', label: 'Fuente de sodas', desc: 'El jugador llena su vaso' },
    { k: 'slush', type: 'dispenser', style: 'slush', label: 'Granizadas', desc: 'Bebida espesa con palanca' },
    { k: 'juice', type: 'dispenser', style: 'juice', label: 'Jugos', desc: 'Tanques con botón PUSH' },
  ];
  const kindOf = (m) => (m.type === 'dispenser' ? (m.style || 'fountain') : m.type);
  const KIND_LABEL = { vending: 'Máquina de bebidas', coffee: 'Máquina de café', fountain: 'Fuente de sodas', slush: 'Granizadas', juice: 'Jugos' };
  const DEF_MODEL = { vending: 'prop_vend_soda_01', coffee: 'prop_vend_coffe_01', fountain: 'prop_food_bs_soda_01', slush: 'prop_slush_dispenser', juice: 'prop_juice_dispenser' };
  const DEF_CUPS = {
    fountain: [{ label: 'Chico', price: 2, ml: 350 }, { label: 'Mediano', price: 3, ml: 500 }, { label: 'Grande', price: 4, ml: 750 }],
    slush: [{ label: 'Chico', price: 3, ml: 350 }, { label: 'Grande', price: 5, ml: 650 }],
    juice: [{ label: 'Chico', price: 2, ml: 350 }, { label: 'Grande', price: 4, ml: 650 }],
  };
  const SWATCHES = ['#b3141c', '#c8102e', '#e0762b', '#f2b705', '#1b7f2e', '#16a085', '#1d6fb8', '#2f8cff', '#6b2a86', '#e04ba0', '#6b4226', '#2b2d33'];
  const SHAPES = [['can', 'Lata'], ['bottle', 'Botella'], ['snack', 'Snack'], ['cup', 'Vaso']];
  const LOGOS = [['script', 'eCola'], ['bold', 'SPRUNK'], ['retro', 'Retro'], ['clean', 'LIMPIO']];
  const REASONS = {
    perm: 'No tienes permiso para usar el creador.',
    id: 'El ID no es válido: usa minúsculas, números y _ (debe empezar con letra).',
    exists: 'Ya existe una máquina con ese ID.',
    rename_config: 'Las máquinas de config.lua no se pueden renombrar.',
    no_products: 'Agrega al menos un producto con item.',
    no_taps: 'Agrega al menos un grifo de bebida con item.',
    no_cups: 'Agrega al menos un tamaño de vaso.',
    config: 'Esa máquina viene de config.lua y no tiene cambios que borrar.',
    data: 'Datos inválidos.',
  };

  /* ---------------- utilidades ---------------- */
  const arr = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? Object.values(x) : []);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => [...root.querySelectorAll(sel)];
  const hex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c.toLowerCase() : '#888888');
  const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').replace(/^[^a-z]+/, '').slice(0, 32);
  const brandVars = (col) => { const c = hex(col); return `--brand:${c};--brand-l:${shade(c, .35)};--brand-d:${shade(c, -.45)};--brand-rgb:${rgb(c).join(',')}`; };
  const guessShape = (p) => {
    if (p.shape) return p.shape;
    const n = String(p.prop || '');
    if (/bottle|bot_/.test(n)) return 'bottle';
    if (/choc|candy|crisp|snak|bar/.test(n)) return 'snack';
    if (/cup/.test(n)) return 'cup';
    return 'can';
  };
  const placementsOf = (id) => C.placements.filter((p) => p.machine === id);
  const modelKey = (m) => String(m).toLowerCase();

  function norm(m) {
    const o = clone(m);
    o.products = arr(o.products).map((p) => ({ item: p.item || '', label: p.label || '', price: +p.price || 1, color: hex(p.color), prop: p.prop || '', shape: p.shape || '' }));
    o.taps = arr(o.taps).map((t) => ({ label: t.label || '', item: t.item || '', color: hex(t.color), ice: !!t.ice }));
    o.cups = arr(o.cups).map((c) => ({ label: c.label || '', price: +c.price || 1, ml: +c.ml || 500 }));
    o.models = arr(o.models).map(String);
    o.spot = o.spot && typeof o.spot === 'object' ? { x: +o.spot.x || 0, y: +o.spot.y || 0 } : { x: o.type === 'vending' ? -0.1 : 0, y: o.type === 'coffee' ? 0.4 : 0.22 };
    o.enabled = o.enabled !== false; o.flip = !!o.flip; o.sugar = o.sugar !== false;
    o.logo = o.logo || 'script'; o.color = hex(o.color); o.brand = o.brand || ''; o.label = o.label || '';
    if (o.type === 'dispenser') o.style = o.style || 'fountain';
    o.prop = o.prop ? String(o.prop) : (o.models[0] || DEF_MODEL[kindOf(o)]);
    o.cupProp = o.cupProp ? String(o.cupProp) : '';
    o.mixItem = o.mixItem || '';
    return o;
  }

  function newMachine(kind) {
    const K = KINDS.find((x) => x.k === kind) || KINDS[0];
    const m = {
      id: '', type: K.type, style: K.style, label: KIND_LABEL[kind], brand: 'Mi Marca', color: '#b3141c', logo: 'script', enabled: true, flip: false,
      models: [], prop: DEF_MODEL[kind], spot: { x: kind === 'vending' ? -0.1 : 0, y: kind === 'coffee' ? 0.4 : 0.22 }, sugar: true, cupProp: '', mixItem: '',
      products: [], taps: [], cups: [], origin: 'custom',
    };
    if (kind === 'vending') m.products = [{ item: 'ecola', label: 'eCola', price: 3, color: '#c8102e', prop: 'prop_ecola_can', shape: 'can' }];
    if (kind === 'coffee') { m.color = '#6b4226'; m.logo = 'clean'; m.brand = 'Mi Café'; m.cupProp = 'p_amb_coffeecup_01'; m.products = [{ item: 'coffee', label: 'Café Negro', price: 3, color: '#3b2314', prop: '', shape: 'cup' }]; }
    if (m.type === 'dispenser') {
      m.cupProp = 'ng_proc_sodacup_01a';
      m.cups = clone(DEF_CUPS[kind]);
      m.taps = kind === 'fountain'
        ? [{ label: 'eCola', item: 'ecola', color: '#5a1a0e', ice: false }, { label: 'Sprunk', item: 'sprunk', color: '#1f9e3a', ice: false }, { label: 'HIELO', item: '', color: '#cfeeff', ice: true }]
        : kind === 'slush' ? [{ label: 'Lima-Limón', item: 'slush_green', color: '#3fd07a', ice: false }, { label: 'Mora Azul', item: 'slush_blue', color: '#2f8cff', ice: false }]
          : [{ label: 'Naranja', item: 'juice_orange', color: '#ffb319', ice: false }, { label: 'Fresa', item: 'juice_strawberry', color: '#ff7a52', ice: false }];
      if (kind === 'slush') { m.color = '#1d6fb8'; m.logo = 'retro'; }
      if (kind === 'juice') { m.color = '#e0762b'; m.logo = 'bold'; }
    }
    return m;
  }

  // cambiar de tipo conservando lo que se pueda
  function convertKind(m, kind) {
    const was = kindOf(m), K = KINDS.find((x) => x.k === kind);
    if (was === kind) return;
    const wasDisp = m.type === 'dispenser', toDisp = K.type === 'dispenser';
    m.type = K.type; m.style = K.style;
    if (m.label === KIND_LABEL[was] || !m.label) m.label = KIND_LABEL[kind];
    if (!m.prop || m.prop === DEF_MODEL[was]) m.prop = DEF_MODEL[kind];
    if (!wasDisp && toDisp) {
      m.taps = m.products.filter((p) => p.item).slice(0, 6).map((p) => ({ label: p.label, item: p.item, color: p.color, ice: false }));
      if (!m.taps.length) m.taps = newMachine(kind).taps;
      m.cups = clone(DEF_CUPS[kind]); m.cupProp = 'ng_proc_sodacup_01a';
    } else if (wasDisp && !toDisp) {
      m.products = m.taps.filter((t) => !t.ice && t.item).map((t) => ({ item: t.item, label: t.label, price: 3, color: t.color, prop: kind === 'vending' ? 'prop_ecola_can' : '', shape: kind === 'coffee' ? 'cup' : 'can' }));
      if (!m.products.length) m.products = newMachine(kind).products;
    }
    if (kind === 'coffee') { m.cupProp = m.cupProp && m.cupProp !== 'ng_proc_sodacup_01a' ? m.cupProp : 'p_amb_coffeecup_01'; m.spot = { x: 0, y: 0.4 }; }
    if (kind === 'vending') m.products.forEach((p) => { if (!p.prop) p.prop = 'prop_ecola_can'; });
  }

  /* ---------------- imágenes de items ---------------- */
  window.KVImgFail = (img) => {
    const name = img.getAttribute('data-n') || '?';
    const s = document.createElement('span'); s.className = 'ci-fb';
    const h = [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % 360;
    s.style.setProperty('--fb1', `hsl(${h},45%,42%)`); s.style.setProperty('--fb2', `hsl(${(h + 40) % 360},45%,24%)`);
    s.textContent = name.replace(/[^a-z0-9]/gi, '').slice(0, 2) || '?';
    img.replaceWith(s);
  };
  function itemImg(name, cls = '') {
    const it = C.itemMap[name];
    const url = it && it.image;
    if (!url) { const t = document.createElement('img'); t.setAttribute('data-n', name || '?'); const wrap = document.createElement('div'); wrap.appendChild(t); KVImgFail(t); return `<div class="ci ${cls}">${wrap.innerHTML}</div>`; }
    return `<div class="ci ${cls}"><img src="${esc(url)}" data-n="${esc(name)}" onerror="KVImgFail(this)" loading="lazy"></div>`;
  }
  // color promedio de la imagen (si el navegador lo permite)
  function imageColor(url) {
    return new Promise((res) => {
      if (!url) return res(null);
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const cv = document.createElement('canvas'); cv.width = cv.height = 24;
          const x = cv.getContext('2d'); x.drawImage(img, 0, 0, 24, 24);
          const d = x.getImageData(0, 0, 24, 24).data; let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 140) continue;
            const R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B);
            const sat = mx - mn; if (sat < 30) continue;
            r += R * sat; g += G * sat; b += B * sat; n += sat;
          }
          if (!n) return res(null);
          res('#' + [r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join(''));
        } catch (e) { res(null); }
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }

  /* ---------------- datos de items ---------------- */
  function loadItems() {
    if (C.items) return Promise.resolve(C.items);
    return new Promise((res) => {
      C.itemsWaiters.push(res);
      if (!C.itemsLoading) { C.itemsLoading = true; post('creator:items'); }
    });
  }
  function setItems(list) {
    C.items = arr(list).filter((i) => i && i.name).map((i) => ({ name: String(i.name), label: String(i.label || i.name), weight: +i.weight || 0, image: i.image || null, desc: i.desc || '' }));
    C.items.forEach((i) => { i.hay = (i.name + ' ' + i.label).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); });
    C.itemMap = {}; C.items.forEach((i) => { C.itemMap[i.name] = i; });
    C.itemsLoading = false;
    C.itemsWaiters.splice(0).forEach((r) => r(C.items));
    if (C.cur) { renderEditor(); renderPreview(); }
    if (IS.open) renderItemGrid();
  }

  /* =====================================================================
     ESTRUCTURA
     ===================================================================== */
  function shell() {
    root.innerHTML = `
    <div class="cr-shell">
      <header class="cr-top">
        <i class="cr-logo"></i>
        <div class="cr-title"><b>Creador de máquinas</b><small id="crInfo"></small></div>
        <span class="sp"></span>
        <span class="cr-kbd"><kbd>ESC</kbd> cerrar</span>
        <button class="cr-x" data-act="close" title="Cerrar">✕</button>
      </header>
      <div class="cr-main">
        <aside class="cr-side">
          <div class="cr-side-top">
            <div class="cr-inp-wrap">${ICON.search}<input class="cr-in" id="crFilter" placeholder="Buscar máquina..."></div>
            <button class="cr-btn pri block" data-act="new">${ICON.plus} Nueva máquina</button>
          </div>
          <div class="cr-list" id="crList"></div>
        </aside>
        <section class="cr-editor" id="crEditor"></section>
        <aside class="cr-preview">
          <div class="cr-pv-t"><span>VISTA PREVIA</span><span id="crPvKind"></span></div>
          <div class="cr-pv-stage" id="crPv"></div>
          <div class="cr-pv-info" id="crPvInfo"></div>
        </aside>
      </div>
      <div class="cr-modal hidden" id="crItems"></div>
      <div class="cr-modal hidden" id="crConfirm"></div>
      <div class="cr-modal hidden" id="crKindPick"></div>
      <div class="cr-flash" id="crFlash"></div>
    </div>`;
    q('#crFilter').addEventListener('input', (e) => { C.filter = e.target.value; renderList(); });
  }

  function flash(msg, type = 'ok') {
    const f = q('#crFlash'); if (!f) return;
    f.className = 'cr-flash show ' + type; f.textContent = msg;
    clearTimeout(flash.t); flash.t = setTimeout(() => { f.className = 'cr-flash ' + type; }, 2600);
  }

  /* ---------------- lista ---------------- */
  function machineIcon(m) { return ICON[kindOf(m)] || ICON.vending; }
  function renderList() {
    const box = q('#crList'); if (!box) return;
    const f = C.filter.toLowerCase().trim();
    const list = C.machines.filter((m) => !f || (m.id + ' ' + (m.brand || '') + ' ' + (m.label || '')).toLowerCase().includes(f));
    const groups = [['custom', 'CREADAS EN EL JUEGO'], ['override', 'DE CONFIG.LUA (EDITADAS)'], ['config', 'DE CONFIG.LUA']];
    let html = '';
    if (C.cur && !C.curId) html += `<div class="cr-group">NUEVA</div>` + listItem(C.cur, true);
    groups.forEach(([g, title]) => {
      const items = list.filter((m) => (m.origin || 'config') === g);
      if (!items.length) return;
      html += `<div class="cr-group">${title}</div>` + items.map((m) => listItem(m, C.curId === m.id)).join('');
    });
    if (!html) html = `<div class="cr-empty-list">No hay máquinas que coincidan.</div>`;
    box.innerHTML = html;
  }
  function listItem(m, on) {
    const pl = m.id ? placementsOf(m.id).length : 0;
    const n = m.type === 'dispenser' ? arr(m.taps).length + ' grifos' : arr(m.products).length + ' productos';
    const pill = m.origin === 'custom' ? '<span class="cr-pill custom">NUEVA</span>' : m.origin === 'override' ? '<span class="cr-pill override">EDITADA</span>' : '';
    const c = hex(m.color);
    return `<div class="cr-item ${on ? 'on' : ''} ${m.enabled === false ? 'off' : ''}" data-act="pick" data-id="${esc(m.id || '')}">
      <div class="cr-dot" style="--c:${c};--c-l:${shade(c, .3)}">${machineIcon(m)}</div>
      <div class="cr-it-txt"><div class="cr-it-name">${esc(m.brand || m.label || m.id || 'Sin nombre')}</div><div class="cr-it-sub">${esc(m.id || 'sin guardar')} · ${n}${pl ? ` · ${pl} colocada${pl > 1 ? 's' : ''}` : ''}</div></div>${pill}</div>`;
  }

  /* ---------------- editor ---------------- */
  function renderEditor() {
    const ed = q('#crEditor'); if (!ed) return;
    const m = C.cur;
    if (!m) {
      ed.innerHTML = `<div class="cr-blank"><div class="big">${ICON.box}</div><b>Elige una máquina o crea una nueva</b>
        <span>Puedes editar las de config.lua o crear máquinas nuevas y colocarlas en cualquier parte del mapa.</span>
        <button class="cr-btn pri" data-act="new" style="margin-top:8px">${ICON.plus} Nueva máquina</button></div>`;
      return;
    }
    const disp = m.type === 'dispenser';
    const c = hex(m.color);
    const nProd = disp ? m.taps.length : m.products.length;
    const nPl = m.id && C.curId ? placementsOf(C.curId).length : 0;
    const origin = !C.curId ? 'Nueva (sin guardar)' : m.origin === 'config' ? 'config.lua' : m.origin === 'override' ? 'config.lua · editada en el juego' : 'creada en el juego';
    ed.innerHTML = `
      <div class="cr-ehead">
        <div class="cr-dot" style="--c:${c};--c-l:${shade(c, .3)}">${machineIcon(m)}</div>
        <div><h2>${esc(m.brand || m.label || 'Nueva máquina')}</h2>
          <div class="meta"><code>${esc(m.id || '—')}</code><span>${origin}</span>${C.dirty ? '<span class="cr-dirty">● cambios sin guardar</span>' : ''}</div></div>
      </div>
      <div class="cr-tabs">
        <button class="cr-tab ${C.tab === 'general' ? 'on' : ''}" data-act="tab" data-tab="general">General</button>
        <button class="cr-tab ${C.tab === 'products' ? 'on' : ''}" data-act="tab" data-tab="products">${disp ? 'Grifos y vasos' : 'Productos'} <span class="n">${nProd}</span></button>
        <button class="cr-tab ${C.tab === 'place' ? 'on' : ''}" data-act="tab" data-tab="place">Colocación <span class="n">${nPl + m.models.length}</span></button>
      </div>
      <div class="cr-body" id="crBody">${C.tab === 'general' ? tabGeneral(m) : C.tab === 'products' ? (disp ? tabTaps(m) : tabProducts(m)) : tabPlace(m)}</div>
      <div class="cr-foot">
        ${C.curId ? `<button class="cr-btn" data-act="dup">${ICON.copy} Duplicar</button>` : ''}
        ${C.curId && m.origin !== 'config' ? `<button class="cr-btn dan" data-act="del">${m.origin === 'override' ? ICON.reset + ' Restablecer' : ICON.trash + ' Eliminar'}</button>` : ''}
        <span class="sp"></span>
        ${C.dirty ? `<button class="cr-btn" data-act="discard">Descartar</button>` : ''}
        <button class="cr-btn pri" data-act="save" ${C.dirty || !C.curId ? '' : 'disabled'}>${ICON.save} Guardar</button>
      </div>`;
  }

  function field(label, inner, cls = '', hint = '') {
    return `<div class="cr-f ${cls}"><label>${label}</label>${inner}${hint ? `<div class="cr-hint">${hint}</div>` : ''}</div>`;
  }
  function toggle(f, on, title, sub) {
    return `<div class="cr-tg ${on ? 'on' : ''}" data-act="toggle" data-f="${f}"><i class="sw"></i><div><b>${title}</b><small>${sub}</small></div></div>`;
  }
  function propOptions(list, value, kindFilter) {
    let found = false;
    const opts = list.filter((p) => !kindFilter || kindFilter(p)).map((p) => {
      const v = p.model || p.prop; if (v === value) found = true;
      return `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(p.label)} (${esc(v)})</option>`;
    }).join('');
    return (value && !found ? `<option value="${esc(value)}" selected>${esc(value)}</option>` : '') + opts + `<option value="__custom">Otro modelo…</option>`;
  }

  function tabGeneral(m) {
    const kind = kindOf(m);
    const isCfg = C.curId && (m.origin === 'config' || m.origin === 'override');
    return `
      <div class="cr-sec">
        <div class="cr-sec-t">Tipo de máquina</div>
        <div class="cr-kinds">${KINDS.map((K) => `<div class="cr-kind ${kind === K.k ? 'on' : ''}" data-act="kind" data-k="${K.k}"><div class="ic">${ICON[K.k]}</div><b>${K.label}</b><small>${K.desc}</small></div>`).join('')}</div>
      </div>
      <div class="cr-sec">
        <div class="cr-sec-t">Identidad</div>
        <div class="cr-grid">
          ${field('Marca <small>(letrero)</small>', `<input class="cr-in" data-f="brand" maxlength="24" value="${esc(m.brand)}" placeholder="eCola, Sprunk, Mi Café...">`)}
          ${field('Texto al interactuar <small>(target / [E])</small>', `<input class="cr-in" data-f="label" maxlength="40" value="${esc(m.label)}" placeholder="Máquina de bebidas">`)}
          ${field('ID interno', `<input class="cr-in mono" data-f="id" maxlength="32" value="${esc(m.id)}" ${isCfg ? 'disabled' : ''} placeholder="mi_maquina">`, '', isCfg ? 'Las máquinas de config.lua conservan su ID.' : 'Minúsculas, números y _. Se usa para guardar.')}
          ${field('Estilo del letrero', `<div class="cr-seg">${LOGOS.map(([k, t]) => `<button class="lg-${k} ${m.logo === k ? 'on' : ''}" data-act="logo" data-v="${k}">${t}</button>`).join('')}</div>`)}
          ${field('Color de la marca', `<div class="cr-colors"><label class="cr-color" style="background:${hex(m.color)}"><input type="color" data-f="color" value="${hex(m.color)}"></label>${SWATCHES.map((s) => `<i class="cr-sw ${hex(m.color) === s ? 'on' : ''}" style="background:${s}" data-act="swatch" data-v="${s}"></i>`).join('')}</div>`, 'full')}
        </div>
      </div>
      <div class="cr-sec">
        <div class="cr-sec-t">Opciones</div>
        <div class="cr-grid">
          ${toggle('enabled', m.enabled, 'Máquina activa', 'Si la apagas, desaparece del juego sin borrarla.')}
          ${m.type === 'coffee' ? toggle('sugar', m.sugar, 'Botones de azúcar', 'El jugador elige de 0 a 5 cubos.') : toggle('flip', m.flip, 'Prop al revés', 'Actívalo si el jugador se para detrás.')}
          ${m.type === 'coffee' ? toggle('flip', m.flip, 'Prop al revés', 'Actívalo si el jugador se para detrás.') : ''}
          ${m.type !== 'vending' ? field('Vaso que recibe el jugador <small>(prop)</small>', `<select class="cr-sel" data-f="cupProp">${propOptions(C.drops.filter((d) => d.shape === 'cup'), m.cupProp)}</select>`) : ''}
          ${m.type === 'dispenser' ? field('Item si mezcla sabores <small>(opcional)</small>', itemButton(m.mixItem, 'mix'), '', 'Vacío = recibe el sabor que más lleva.') : ''}
        </div>
      </div>
      ${m.type !== 'dispenser' ? `<div class="cr-sec">
        <div class="cr-sec-t">¿Dónde sale el producto?</div>
        <div class="cr-sec-d">Posición en la máquina (en % del ancho y alto). Ajústalo si la lata o el vaso aparece en un lugar raro.</div>
        <div class="cr-grid">
          ${field('Horizontal', `<div class="cr-range"><input type="range" min="-0.5" max="0.5" step="0.01" data-f="spot.x" value="${m.spot.x}"><output>${(+m.spot.x).toFixed(2)}</output></div>`)}
          ${field('Altura', `<div class="cr-range"><input type="range" min="0" max="1" step="0.01" data-f="spot.y" value="${m.spot.y}"><output>${(+m.spot.y).toFixed(2)}</output></div>`)}
        </div></div>` : ''}`;
  }

  function itemButton(name, key) {
    if (!name) return `<button class="cr-itembtn empty" data-act="item" data-key="${key}">${ICON.search}<span class="tx"><b>Buscar item…</b></span></button>`;
    const it = C.itemMap[name];
    const bad = C.items && !it;
    return `<button class="cr-itembtn ${bad ? 'bad' : ''}" data-act="item" data-key="${key}" title="${bad ? 'Este item no está en tu inventario' : ''}">${itemImg(name)}<span class="tx"><b>${esc(it ? it.label : name)}</b><code>${esc(name)}</code></span><span class="chev">▾</span></button>`;
  }

  function tabProducts(m) {
    const vend = m.type === 'vending';
    const rows = m.products.map((p, i) => `
      <div class="cr-row prod" data-row="products" data-i="${i}">
        <div class="pv" data-pv="${i}">${productHTML({ label: p.label, color: p.color, shape: guessShape(p) })}</div>
        ${field('Item', itemButton(p.item, 'products:' + i))}
        ${field('Nombre', `<input class="cr-in" data-rf="label" maxlength="20" value="${esc(p.label)}">`)}
        ${field('Precio', `<div class="cr-pre"><span>${esc(C.symbol)}</span><input class="cr-in mono ${p.price > C.maxCredit ? 'bad' : ''}" type="number" min="1" max="${C.maxCredit}" data-rf="price" data-t="int" value="${p.price}"></div>`)}
        ${field('Color', `<label class="cr-color sm" style="background:${p.color}"><input type="color" data-rf="color" value="${p.color}"></label>`)}
        <div class="acts" style="align-self:end">
          <button class="cr-ib" data-act="rowUp" title="Subir" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
          <button class="cr-ib" data-act="rowDown" title="Bajar" ${i === m.products.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          <button class="cr-ib dan" data-act="rowDel" title="Quitar">${ICON.trash}</button>
        </div>
        <div class="cr-row2">
          ${vend ? field('Prop que cae al suelo', `<select class="cr-sel" data-rf="prop">${propOptions(C.drops.filter((d) => d.shape !== 'cup'), p.prop)}</select>`) : field('Se sirve en', `<input class="cr-in" disabled value="${esc(m.cupProp || 'p_amb_coffeecup_01')}">`)}
          ${field('Dibujo en la vitrina', `<div class="cr-seg">${SHAPES.map(([k, t]) => `<button class="${guessShape(p) === k ? 'on' : ''}" data-act="shape" data-v="${k}">${t}</button>`).join('')}</div>`)}
        </div>
      </div>`).join('');
    return `<div class="cr-sec">
        <div class="cr-sec-t">${vend ? 'Productos de la vitrina' : 'Bebidas del menú'} <span class="sp"></span><span class="cr-hint">Precio en monedas · máximo ${esc(C.symbol)}${C.maxCredit}</span></div>
        <div class="cr-rows">${rows || '<div class="cr-note warn">Todavía no hay productos.</div>'}</div>
        <button class="cr-btn dash block" style="margin-top:12px;height:46px" data-act="addProduct" ${m.products.length >= 16 ? 'disabled' : ''}>${ICON.plus} Agregar ${vend ? 'producto' : 'bebida'} desde el buscador de items</button>
      </div>`;
  }

  function tabTaps(m) {
    const taps = m.taps.map((t, i) => `
      <div class="cr-row tap" data-row="taps" data-i="${i}">
        <div class="pv" data-pv="${i}"><div class="mini-badge ${t.ice ? 'ice' : ''}" style="--c:${t.color}">${esc(t.label)}</div></div>
        ${t.ice ? field('Tipo', `<div class="cr-itembtn" style="cursor:default"><span class="tx"><b>Hielo</b><code>agrega cubos al vaso</code></span></div>`) : field('Item que recibe', itemButton(t.item, 'taps:' + i))}
        ${field('Nombre del grifo', `<input class="cr-in" data-rf="label" maxlength="20" value="${esc(t.label)}">`)}
        ${field('Color', `<label class="cr-color sm" style="background:${t.color}"><input type="color" data-rf="color" value="${t.color}"></label>`)}
        <div class="acts" style="align-self:end">
          <button class="cr-ib" data-act="rowUp" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
          <button class="cr-ib" data-act="rowDown" ${i === m.taps.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          <button class="cr-ib dan" data-act="rowDel">${ICON.trash}</button>
        </div>
      </div>`).join('');
    const cups = m.cups.map((c, i) => `
      <div class="cr-row cupr" data-row="cups" data-i="${i}">
        <div class="cupic" style="--c:${hex(m.color)}; transform:scale(${Math.max(.7, Math.min(1.25, c.ml / 500))})"></div>
        ${field('Tamaño', `<input class="cr-in" data-rf="label" maxlength="16" value="${esc(c.label)}">`)}
        ${field('Precio', `<div class="cr-pre"><span>${esc(C.symbol)}</span><input class="cr-in mono" type="number" min="1" data-rf="price" data-t="int" value="${c.price}"></div>`)}
        ${field('Mililitros', `<input class="cr-in mono" type="number" min="100" max="2000" step="50" data-rf="ml" data-t="int" value="${c.ml}">`)}
        <div class="acts" style="align-self:end"><button class="cr-ib dan" data-act="rowDel">${ICON.trash}</button></div>
      </div>`).join('');
    const hasIce = m.taps.some((t) => t.ice);
    return `<div class="cr-sec">
        <div class="cr-sec-t">Grifos <span class="sp"></span><span class="cr-hint">Máximo 8</span></div>
        <div class="cr-rows">${taps || '<div class="cr-note warn">Agrega al menos un grifo.</div>'}</div>
        <div class="cr-grid" style="margin-top:12px">
          <button class="cr-btn dash" style="height:44px" data-act="addTap" ${m.taps.length >= 8 ? 'disabled' : ''}>${ICON.plus} Agregar grifo desde el buscador</button>
          <button class="cr-btn dash" style="height:44px" data-act="addIce" ${m.taps.length >= 8 || hasIce ? 'disabled' : ''}>${ICON.plus} Agregar dispensador de hielo</button>
        </div>
      </div>
      <div class="cr-sec">
        <div class="cr-sec-t">Tamaños de vaso <span class="sp"></span><span class="cr-hint">Se cobra del efectivo al tapar</span></div>
        <div class="cr-rows">${cups || '<div class="cr-note warn">Agrega al menos un vaso.</div>'}</div>
        <button class="cr-btn dash block" style="margin-top:12px;height:44px" data-act="addCup" ${m.cups.length >= 4 ? 'disabled' : ''}>${ICON.plus} Agregar tamaño</button>
      </div>`;
  }

  function tabPlace(m) {
    const saved = !!C.curId && !C.dirty;
    const pls = C.curId ? placementsOf(C.curId) : [];
    const chips = m.models.map((md, i) => {
      const st = C.modelStatus[modelKey(md)];
      const other = C.machines.find((x) => x.id !== C.curId && x.enabled !== false && arr(x.models).map(modelKey).includes(modelKey(md)));
      return `<span class="cr-chip" title="${other ? 'También lo usa: ' + esc(other.id) : ''}"><i class="st ${st === true ? 'ok' : st === false ? 'bad' : ''}"></i>${esc(md)}${other ? ` <small style="color:#ffcf6b">⚠ ${esc(other.id)}</small>` : ''}<button data-act="modelDel" data-i="${i}">✕</button></span>`;
    }).join('');
    const placeList = pls.map((p) => `
      <div class="cr-place">
        <div class="pi ${p.kind === 'zone' ? 'zone' : ''}">${p.kind === 'zone' ? ICON.map : ICON.pin}</div>
        <div class="tx"><b>#${p.id} · ${p.kind === 'zone' ? 'Máquina del mapa' : 'Prop colocado'}</b><code>${(+p.x).toFixed(2)}, ${(+p.y).toFixed(2)}, ${(+p.z).toFixed(2)} · ${(+p.h || 0).toFixed(0)}°${p.model ? ' · ' + esc(p.model) : ''}</code></div>
        <button class="cr-btn sm" data-act="tp" data-pid="${p.id}">${ICON.go} Ir</button>
        <button class="cr-ib dan" data-act="unplace" data-pid="${p.id}" title="Quitar">${ICON.trash}</button>
      </div>`).join('');
    return `
      ${!saved ? `<div class="cr-note warn">${ICON.save}<div><b>Guarda la máquina primero</b> para poder colocarla en el mundo.</div></div>` : ''}
      <div class="cr-bigacts">
        <button class="cr-bigact" data-act="place" ${saved ? '' : 'disabled'}><div class="ic">${ICON.pin}</div><div><b>Colocar prop en el mundo</b><small>Aparece un fantasma donde miras. Rueda = girar, E = colocar.</small></div></button>
        <button class="cr-bigact" data-act="zone" ${saved ? '' : 'disabled'}><div class="ic g">${ICON.map}</div><div><b>Usar una máquina del mapa</b><small>Para máquinas que son parte del edificio (MLO) y no son objetos.</small></div></button>
      </div>
      <div class="cr-sec">
        <div class="cr-sec-t">Prop para colocar</div>
        <select class="cr-sel" data-f="prop">${propOptions(C.props, m.prop)}</select>
      </div>
      <div class="cr-sec">
        <div class="cr-sec-t">Colocadas en el mundo <span class="sp"></span><span class="cr-hint">${pls.length} en total</span></div>
        <div class="cr-places">${placeList || '<div class="cr-hint">Todavía no has colocado esta máquina.</div>'}</div>
      </div>
      <div class="cr-sec">
        <div class="cr-sec-t">Todas las del mapa con este modelo</div>
        <div class="cr-sec-d">Si agregas un modelo aquí, <b>todas</b> las máquinas de ese modelo que ya existen en el mapa usarán esta configuración. Mira el objeto en el juego y usa <code>/kvmodel</code> para saber su nombre.</div>
        <div class="cr-chips">${chips || '<span class="cr-hint">Ningún modelo: solo funcionan las que coloques arriba.</span>'}</div>
        <div class="cr-addrow">
          <input class="cr-in mono" id="crModelIn" list="crModelList" placeholder="prop_vend_soda_01 o un hash">
          <datalist id="crModelList">${C.props.map((p) => `<option value="${esc(p.model)}">${esc(p.label)}</option>`).join('')}</datalist>
          <button class="cr-btn" data-act="modelAdd">${ICON.plus} Agregar</button>
        </div>
      </div>`;
  }

  /* ---------------- vista previa ---------------- */
  function renderPreview() {
    const pv = q('#crPv'), info = q('#crPvInfo'); if (!pv) return;
    const m = C.cur;
    if (!m) { pv.innerHTML = `<div class="cr-hint">Sin máquina seleccionada</div>`; info.innerHTML = ''; q('#crPvKind').textContent = ''; return; }
    const kind = kindOf(m);
    q('#crPvKind').textContent = (KINDS.find((k) => k.k === kind) || {}).label || '';
    const sign = `<div class="pv-sign"><div class="m-logo ${logoClass(m.logo)}">${esc(m.brand || ' ')}</div></div>`;
    if (m.type === 'dispenser') {
      const tanks = kind !== 'fountain' ? `<div class="pv-tanks">${m.taps.filter((t) => !t.ice).map((t) => `<div class="pv-tank" style="--c:${t.color}"></div>`).join('')}</div>` : '';
      pv.innerHTML = `<div class="pv-disp" style="${brandVars(m.color)}">${sign}${tanks}<div class="pv-taps">${m.taps.map((t) => `<div class="mini-badge ${t.ice ? 'ice' : ''}" style="--c:${t.color}">${esc(t.label)}</div>`).join('')}</div><div class="pv-dbay">${m.cups.map((c) => `<i style="transform:scale(${Math.max(.7, Math.min(1.3, c.ml / 500))});transform-origin:bottom"></i>`).join('')}</div></div>`;
    } else if (m.type === 'coffee') {
      pv.innerHTML = `<div class="pv-m coffee" style="${brandVars(m.color)}">${sign}<div class="pv-body"><div class="pv-menu">${m.products.map((p) => `<div class="pv-drink"><i style="--c:${p.color}"></i>${esc(p.label)}<span>${esc(C.symbol)}${p.price}</span></div>`).join('')}</div>
        <div class="pv-ctrl"><div class="pv-lcd">${esc(C.symbol)}0</div><div class="pv-slotp"></div></div></div></div>`;
    } else {
      const n = m.products.length, cols = n <= 1 ? 1 : (n === 2 || n === 4) ? 2 : n > 9 ? 4 : 3;
      pv.innerHTML = `<div class="pv-m" style="${brandVars(m.color)}">${sign}<div class="pv-body"><div class="pv-win" style="--cols:${cols}">${m.products.map((p) => `<div class="pv-slot"><div class="prw">${productHTML({ label: p.label, color: p.color, shape: guessShape(p) })}</div><span class="tg">${esc(C.symbol)}${p.price}</span></div>`).join('')}</div>
        <div class="pv-ctrl"><div class="pv-lcd">${esc(C.symbol)}0</div><div class="pv-slotp"></div><div class="pv-keys">${'<i></i>'.repeat(9)}</div></div></div><div class="pv-bay">EMPUJE</div></div>`;
    }
    // datos y avisos
    const pls = C.curId ? placementsOf(C.curId) : [];
    const list = m.type === 'dispenser' ? m.cups : m.products;
    const prices = list.map((x) => +x.price || 0);
    const stats = [
      [m.type === 'dispenser' ? 'Grifos' : 'Productos', m.type === 'dispenser' ? m.taps.length : m.products.length],
      ['Precios', prices.length ? `${C.symbol}${Math.min(...prices)} – ${C.symbol}${Math.max(...prices)}` : '—'],
      ['Modelos del mapa', m.models.length],
      ['Props colocados', pls.filter((p) => p.kind !== 'zone').length],
      ['Máquinas del mapa', pls.filter((p) => p.kind === 'zone').length],
    ];
    const warns = [];
    if (m.enabled === false) warns.push(['', 'Está desactivada: no aparece en el juego.']);
    if (m.type !== 'dispenser') {
      if (!m.products.some((p) => p.item)) warns.push(['err', 'No tiene productos con item.']);
      m.products.forEach((p) => { if (p.price > C.maxCredit) warns.push(['err', `"${p.label}" cuesta más que el crédito máximo (${C.symbol}${C.maxCredit}). Nadie podría comprarlo.`]); });
    } else {
      if (!m.taps.some((t) => !t.ice && t.item)) warns.push(['err', 'No tiene grifos con bebida.']);
      if (!m.cups.length) warns.push(['err', 'No tiene tamaños de vaso.']);
    }
    if (C.items) {
      const names = m.type === 'dispenser' ? m.taps.filter((t) => !t.ice).map((t) => t.item) : m.products.map((p) => p.item);
      names.filter((n) => n && !C.itemMap[n]).forEach((n) => warns.push(['', `El item "${n}" no existe en tu inventario.`]));
    }
    m.models.forEach((md) => { if (C.modelStatus[modelKey(md)] === false) warns.push(['err', `El modelo "${md}" no existe en el juego.`]); });
    if (C.curId && !m.models.length && !pls.length) warns.push(['', 'Todavía no está en el mundo. Ve a la pestaña Colocación.']);
    if (!warns.length) warns.push(['ok', 'Todo listo ✓']);
    info.innerHTML = stats.map(([a, b]) => `<div class="cr-stat"><span>${a}</span><b>${b}</b></div>`).join('') + warns.map(([t, w]) => `<div class="cr-warn ${t}">${esc(w)}</div>`).join('');
  }

  /* ---------------- acciones ---------------- */
  function setDirty() {
    if (!C.dirty) { C.dirty = true; renderEditorHeadOnly(); }
    renderPreview();
  }
  function renderEditorHeadOnly() {
    const meta = q('.cr-ehead .meta');
    if (meta && !meta.querySelector('.cr-dirty')) meta.insertAdjacentHTML('beforeend', '<span class="cr-dirty">● cambios sin guardar</span>');
    const foot = q('.cr-foot');
    if (foot) {
      const save = foot.querySelector('[data-act="save"]'); if (save) save.disabled = false;
      if (!foot.querySelector('[data-act="discard"]') && save) save.insertAdjacentHTML('beforebegin', '<button class="cr-btn" data-act="discard">Descartar</button>');
    }
    if (C.tab === 'place') { const b = q('#crBody'); if (b) b.innerHTML = tabPlace(C.cur); }
  }
  function refreshHead() {
    const m = C.cur; const h = q('.cr-ehead'); if (!h || !m) return;
    const c = hex(m.color);
    h.querySelector('.cr-dot').style.cssText = `--c:${c};--c-l:${shade(c, .3)}`;
    h.querySelector('h2').textContent = m.brand || m.label || 'Nueva máquina';
    h.querySelector('code').textContent = m.id || '—';
  }

  async function confirmBox(text, ok = 'Aceptar', danger = false) {
    const box = q('#crConfirm');
    box.innerHTML = `<div class="cr-dlg sm"><div class="cr-dlg-h"><b>¿Seguro?</b></div><div class="cr-dlg-b"><p>${text}</p></div>
      <div class="cr-dlg-f"><button class="cr-btn" data-c="0">Cancelar</button><button class="cr-btn ${danger ? 'dan' : 'pri'}" data-c="1">${ok}</button></div></div>`;
    box.classList.remove('hidden');
    return new Promise((res) => {
      confirmBox.res = (v) => { box.classList.add('hidden'); confirmBox.res = null; res(v); };
      box.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => confirmBox.res(b.dataset.c === '1')));
    });
  }

  async function pick(id) {
    if (C.dirty && !(await confirmBox('Tienes cambios sin guardar en esta máquina. ¿Descartarlos?', 'Descartar', true))) return;
    const m = C.machines.find((x) => x.id === id);
    if (!m) return;
    C.cur = norm(m); C.curId = id; C.dirty = false; C.idTouched = true;
    if (C.tab === 'place' && !C.curId) C.tab = 'general';
    checkModels(C.cur.models);
    renderAll();
  }

  async function startNew(kind) {
    if (C.dirty && !(await confirmBox('Tienes cambios sin guardar. ¿Descartarlos?', 'Descartar', true))) return;
    C.cur = newMachine(kind); C.curId = null; C.dirty = true; C.idTouched = false; C.tab = 'general';
    autoId();
    renderAll();
    SFX.ok && SFX.ok();
  }
  function openKindPicker() {
    const box = q('#crKindPick');
    box.innerHTML = `<div class="cr-dlg" style="width:min(760px,92%)"><div class="cr-dlg-h"><b>Nueva máquina</b><small>¿Qué tipo de máquina quieres crear?</small><span class="sp"></span><button class="cr-x" data-k="x">✕</button></div>
      <div class="cr-dlg-b"><div class="cr-kinds">${KINDS.map((K) => `<div class="cr-kind" data-k="${K.k}"><div class="ic">${ICON[K.k]}</div><b>${K.label}</b><small>${K.desc}</small></div>`).join('')}</div></div></div>`;
    box.classList.remove('hidden');
    box.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('click', () => { box.classList.add('hidden'); if (el.dataset.k !== 'x') startNew(el.dataset.k); }));
  }

  function autoId() {
    if (C.idTouched || C.curId) return;
    let base = slug(C.cur.brand || C.cur.label) || 'maquina';
    let id = base, n = 2;
    while (C.machines.some((m) => m.id === id)) id = `${base}_${n++}`.slice(0, 32);
    C.cur.id = id;
    const inp = q('[data-f="id"]'); if (inp && document.activeElement !== inp) inp.value = id;
  }

  function validate(m) {
    if (!/^[a-z][a-z0-9_]{0,31}$/.test(m.id || '')) return REASONS.id;
    if (!C.curId && C.machines.some((x) => x.id === m.id)) return REASONS.exists;
    if (C.curId && C.curId !== m.id && C.machines.some((x) => x.id === m.id)) return REASONS.exists;
    if (m.type === 'dispenser') {
      if (!m.taps.some((t) => !t.ice && t.item)) return REASONS.no_taps;
      if (!m.cups.length) return REASONS.no_cups;
    } else if (!m.products.some((p) => p.item)) return REASONS.no_products;
    return null;
  }

  async function save() {
    const m = C.cur; if (!m) return;
    const err = validate(m);
    if (err) { flash(err, 'err'); SFX.error && SFX.error(); return; }
    const payload = clone(m); payload.oldId = C.curId || '';
    delete payload.origin;
    if (payload.type !== 'dispenser') { delete payload.taps; delete payload.cups; } else delete payload.products;
    const r = await post('creator:save', payload);
    if (!r || !r.ok) { flash(REASONS[r && r.reason] || 'No se pudo guardar.', 'err'); SFX.error && SFX.error(); return; }
    C.machines = arr(r.machines); C.placements = arr(r.placements);
    const saved = C.machines.find((x) => x.id === r.id);
    C.cur = norm(saved || m); C.curId = r.id; C.dirty = false;
    renderAll();
    flash('Máquina guardada. Ya está en el juego para todos.', 'ok');
    SFX.ding && SFX.ding();
  }

  async function del() {
    const m = C.cur; if (!m || !C.curId) return;
    const reset = m.origin === 'override';
    const ok = await confirmBox(reset
      ? `Se borrarán los cambios hechos en el juego y <b>${esc(C.curId)}</b> volverá a como está en config.lua.`
      : `Se eliminará <b>${esc(C.curId)}</b> y sus ${placementsOf(C.curId).length} colocaciones. No se puede deshacer.`, reset ? 'Restablecer' : 'Eliminar', true);
    if (!ok) return;
    const r = await post('creator:delete', { id: C.curId });
    if (!r || !r.ok) { flash(REASONS[r && r.reason] || 'No se pudo borrar.', 'err'); return; }
    C.machines = arr(r.machines); C.placements = arr(r.placements);
    const back = C.machines.find((x) => x.id === C.curId);
    if (back) { C.cur = norm(back); } else { C.cur = null; C.curId = null; }
    C.dirty = false;
    renderAll();
    flash(reset ? 'Restablecida a config.lua.' : 'Máquina eliminada.', 'ok');
  }

  function dup() {
    const m = clone(C.cur);
    m.origin = 'custom'; m.models = []; m.brand = (m.brand || '') + ' 2';
    C.cur = m; C.curId = null; C.dirty = true; C.idTouched = false; C.tab = 'general';
    autoId(); renderAll();
    flash('Copia creada. Cámbiale lo que quieras y guarda.', 'ok');
  }

  async function discard() {
    if (!(await confirmBox('¿Descartar los cambios sin guardar?', 'Descartar', true))) return;
    if (C.curId) { const m = C.machines.find((x) => x.id === C.curId); C.cur = m ? norm(m) : null; } else { C.cur = null; }
    C.dirty = false; renderAll();
  }

  function checkModels(list) {
    list.forEach(async (md) => {
      const k = modelKey(md);
      if (C.modelStatus[k] !== undefined) return;
      const r = await post('creator:checkModel', { model: md });
      C.modelStatus[k] = !!(r && r.ok);
      if (C.tab === 'place' && C.cur) { const b = q('#crBody'); if (b) b.innerHTML = tabPlace(C.cur); }
      renderPreview();
    });
  }

  function closeCreator(force) {
    const go = () => { C.open = false; root.classList.add('hidden'); post('creator:close'); };
    if (!force && C.dirty) return confirmBox('Tienes cambios sin guardar. Si cierras se perderán.', 'Cerrar sin guardar', true).then((ok) => ok && go());
    go();
  }

  function renderAll() { renderList(); renderEditor(); renderPreview(); }

  /* ---------------- eventos (delegados) ---------------- */
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    const act = el.dataset.act, m = C.cur;
    const rowEl = el.closest('[data-row]');
    const listName = rowEl && rowEl.dataset.row, idx = rowEl ? +rowEl.dataset.i : -1;
    switch (act) {
      case 'close': return closeCreator();
      case 'new': return openKindPicker();
      case 'pick': return el.dataset.id ? pick(el.dataset.id) : null;
      case 'tab': C.tab = el.dataset.tab; renderEditor(); return;
      case 'save': return save();
      case 'del': return del();
      case 'dup': return dup();
      case 'discard': return discard();
      case 'kind': convertKind(m, el.dataset.k); setDirty(); renderEditor(); renderList(); return;
      case 'logo': m.logo = el.dataset.v; setDirty(); el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); return;
      case 'swatch': m.color = el.dataset.v; setDirty(); refreshHead(); renderList(); el.parentElement.querySelectorAll('.cr-sw').forEach((b) => b.classList.toggle('on', b === el));
        { const ci = el.parentElement.querySelector('.cr-color'); ci.style.background = m.color; ci.querySelector('input').value = m.color; } return;
      case 'toggle': { const f = el.dataset.f; m[f] = !m[f]; el.classList.toggle('on', m[f]); setDirty(); renderList(); return; }
      case 'item': return pickItemFor(el.dataset.key);
      case 'shape': { const p = m.products[idx]; p.shape = el.dataset.v; el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); updateRowPv(rowEl); setDirty(); return; }
      case 'rowUp': case 'rowDown': {
        const L = m[listName], j = act === 'rowUp' ? idx - 1 : idx + 1;
        if (j < 0 || j >= L.length) return; [L[idx], L[j]] = [L[j], L[idx]]; setDirty(); renderEditor(); return;
      }
      case 'rowDel': m[listName].splice(idx, 1); setDirty(); renderEditor(); renderList(); return;
      case 'addProduct': return openItems({ onPick: async (it) => {
        const p = { item: it.name, label: it.label.slice(0, 20), price: 3, color: '#c8102e', prop: m.type === 'vending' ? guessDrop(it) : '', shape: m.type === 'coffee' ? 'cup' : '' };
        if (m.type === 'vending') p.shape = (C.drops.find((d) => d.prop === p.prop) || {}).shape || 'can';
        m.products.push(p); setDirty(); renderEditor(); renderList();
        const col = await imageColor(it.image); if (col) { p.color = col; renderEditor(); renderPreview(); }
      } });
      case 'addTap': return openItems({ onPick: async (it) => {
        const t = { label: it.label.slice(0, 20), item: it.name, color: '#c8102e', ice: false };
        m.taps.push(t); setDirty(); renderEditor(); renderList();
        const col = await imageColor(it.image); if (col) { t.color = col; renderEditor(); renderPreview(); }
      } });
      case 'addIce': m.taps.push({ label: 'HIELO', item: '', color: '#cfeeff', ice: true }); setDirty(); renderEditor(); return;
      case 'addCup': m.cups.push({ label: m.cups.length ? 'Extra' : 'Mediano', price: 3, ml: 500 }); setDirty(); renderEditor(); return;
      case 'modelAdd': {
        const inp = q('#crModelIn'); const v = (inp.value || '').trim();
        if (!/^[A-Za-z0-9_-]{2,64}$/.test(v)) { inp.classList.add('bad'); return; }
        if (!m.models.map(modelKey).includes(modelKey(v))) { m.models.push(v); setDirty(); checkModels([v]); }
        const b = q('#crBody'); if (b) b.innerHTML = tabPlace(m);
        return;
      }
      case 'modelDel': m.models.splice(+el.dataset.i, 1); setDirty(); { const b = q('#crBody'); if (b) b.innerHTML = tabPlace(m); } return;
      case 'place': case 'zone':
        if (C.dirty || !C.curId) return flash('Guarda la máquina primero.', 'err');
        C.open = false; root.classList.add('hidden');
        post(act === 'place' ? 'creator:place' : 'creator:zone', { id: C.curId, model: m.prop || m.models[0] || DEF_MODEL[kindOf(m)], cfg: { flip: m.flip } });
        return;
      case 'tp': if (C.dirty && !(await confirmBox('Tienes cambios sin guardar. ¿Ir de todos modos?', 'Ir', false))) return;
        C.open = false; root.classList.add('hidden'); post('creator:tp', { pid: +el.dataset.pid }); return;
      case 'unplace': {
        if (!(await confirmBox(`¿Quitar la colocación #${el.dataset.pid}?`, 'Quitar', true))) return;
        const r = await post('creator:removePlacement', { pid: +el.dataset.pid });
        if (r && r.ok) { C.placements = arr(r.placements); renderAll(); flash('Colocación quitada.', 'ok'); } else flash('No se pudo quitar.', 'err');
        return;
      }
    }
  });

  function guessDrop(it) {
    const s = (it.name + ' ' + it.label).toLowerCase();
    if (/agua|water|bottle|botella|beer|cerveza/.test(s)) return /beer|cerveza/.test(s) ? 'prop_amb_beer_bottle' : 'prop_ld_flow_bottle';
    if (/sprunk/.test(s)) return 'prop_ld_can_01';
    if (/orang|naranja/.test(s)) return 'prop_orang_can_01';
    if (/energy|energ/.test(s)) return 'prop_energy_drink';
    if (/choc|ego|meteor/.test(s)) return 'prop_choc_ego';
    if (/candy|dulce|pqs|chips|snack/.test(s)) return 'prop_candy_pqs';
    return 'prop_ecola_can';
  }

  function updateRowPv(rowEl) {
    if (!rowEl) return;
    const i = +rowEl.dataset.i, L = rowEl.dataset.row, pv = rowEl.querySelector('[data-pv]'), m = C.cur;
    if (!pv) return;
    if (L === 'products') { const p = m.products[i]; pv.innerHTML = productHTML({ label: p.label, color: p.color, shape: guessShape(p) }); }
    if (L === 'taps') { const t = m.taps[i]; pv.innerHTML = `<div class="mini-badge ${t.ice ? 'ice' : ''}" style="--c:${t.color}">${esc(t.label)}</div>`; }
    if (L === 'cups') { /* nada */ }
  }

  root.addEventListener('input', (e) => {
    const el = e.target, m = C.cur; if (!m) return;
    if (el.dataset.f) {
      const f = el.dataset.f;
      if (f === 'spot.x' || f === 'spot.y') { m.spot[f.slice(5)] = +el.value; const o = el.parentElement.querySelector('output'); if (o) o.textContent = (+el.value).toFixed(2); }
      else if (f === 'id') { m.id = slug(el.value) || ''; C.idTouched = true; }
      else if (f === 'color') { m.color = hex(el.value); el.parentElement.style.background = m.color; renderList(); }
      else if (f === 'prop' || f === 'cupProp') return; // se maneja en 'change'
      else m[f] = el.value;
      if (f === 'brand' || f === 'label') autoId();
      refreshHead(); setDirty();
      if (f === 'brand') renderList();
      return;
    }
    if (el.dataset.rf) {
      const row = el.closest('[data-row]'); const L = m[row.dataset.row], i = +row.dataset.i, f = el.dataset.rf;
      let v = el.value;
      if (el.dataset.t === 'int') v = Math.max(0, Math.round(+v || 0));
      if (f === 'color') { v = hex(v); el.parentElement.style.background = v; }
      if (f === 'prop') return;
      L[i][f] = v;
      if (f === 'price' && row.dataset.row === 'products') el.classList.toggle('bad', v > C.maxCredit || v < 1);
      updateRowPv(row); setDirty();
    }
  });
  root.addEventListener('change', async (e) => {
    const el = e.target, m = C.cur; if (!m || el.tagName !== 'SELECT') return;
    let v = el.value;
    if (v === '__custom') {
      v = await askBox('Otro modelo', 'Escribe el nombre del prop (ej: prop_vend_soda_01) o su hash.', 'prop_...');
      if (!v || !/^[A-Za-z0-9_-]{2,64}$/.test(v)) { renderEditor(); return; }
    }
    if (el.dataset.f) { m[el.dataset.f] = v; if (el.dataset.f === 'prop') checkModels([v]); }
    if (el.dataset.rf) {
      const row = el.closest('[data-row]'); const p = m[row.dataset.row][+row.dataset.i];
      p[el.dataset.rf] = v;
      if (el.dataset.rf === 'prop') { const d = C.drops.find((x) => x.prop === v); if (d) p.shape = d.shape; }
      updateRowPv(row);
    }
    setDirty();
    if (v !== el.value || el.dataset.rf === 'prop') renderEditor();
  });

  function askBox(title, text, ph) {
    const box = q('#crConfirm');
    box.innerHTML = `<div class="cr-dlg sm"><div class="cr-dlg-h"><b>${esc(title)}</b></div><div class="cr-dlg-b"><p style="margin-bottom:10px">${esc(text)}</p><input class="cr-in mono" id="crAsk" placeholder="${esc(ph)}"></div>
      <div class="cr-dlg-f"><button class="cr-btn" data-c="0">Cancelar</button><button class="cr-btn pri" data-c="1">Usar</button></div></div>`;
    box.classList.remove('hidden');
    const inp = box.querySelector('#crAsk'); setTimeout(() => inp.focus(), 30);
    return new Promise((res) => {
      confirmBox.res = (ok) => { box.classList.add('hidden'); confirmBox.res = null; res(ok ? inp.value.trim() : ''); };
      box.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => confirmBox.res(b.dataset.c === '1')));
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmBox.res(true); });
    });
  }

  async function pickItemFor(key) {
    const m = C.cur; if (!m) return;
    let cur = '';
    if (key === 'mix') cur = m.mixItem;
    else { const [L, i] = key.split(':'); cur = m[L][+i].item; }
    openItems({
      current: cur, allowClear: key === 'mix',
      onPick: async (it) => {
        if (key === 'mix') { m.mixItem = it ? it.name : ''; setDirty(); renderEditor(); return; }
        const [L, i] = key.split(':'); const row = m[L][+i];
        const oldLabel = (C.itemMap[row.item] || {}).label;
        row.item = it.name;
        if (!row.label || row.label === row.item || row.label === oldLabel || /^(nuevo|producto)/i.test(row.label)) row.label = it.label.slice(0, 20);
        setDirty(); renderEditor();
        const col = await imageColor(it.image); if (col && (L === 'products' || L === 'taps')) { row.color = col; renderEditor(); renderPreview(); }
      },
    });
  }

  /* =====================================================================
     BUSCADOR DE ITEMS
     ===================================================================== */
  const IS = { open: false, q: '', filter: 'all', onPick: null, current: '', kb: -1, results: [] };
  const DRINK_RX = /agua|water|cola|soda|sprunk|juice|jugo|coffee|caf[eé]|\bte\b|\btea\b|beer|cerveza|drink|bebida|leche|milk|slush|granizad|energ|whisk|vodka|wine|vino|tequila|\bron\b|rum|limonada|lemonade|smoothie|batido|capuch|cappu|latte|chocolate caliente|hot_chocolate|orang|refresco/i;
  const FOOD_RX = /burger|hamburg|sandwich|taco|chips|papas|choc|candy|dulce|donut|dona|pizza|food|comida|snack|\bpan\b|bread|hot ?dog|fries|galleta|cookie|meteorite|ego|pqs|bar\b|barra|cereal|fruta|fruit|manzana|apple|banana/i;

  function openItems({ onPick, current = '', allowClear = false }) {
    IS.open = true; IS.onPick = onPick; IS.current = current; IS.kb = -1; IS.allowClear = allowClear;
    const box = q('#crItems');
    box.innerHTML = `<div class="cr-dlg">
      <div class="cr-dlg-h"><div class="cr-dot" style="--c:#ffb020;--c-l:#ffd27a;width:34px;height:34px">${ICON.item}</div><div><b>Buscador de items</b><br><small id="isSub">Cargando items de tu inventario…</small></div><span class="sp"></span><button class="cr-x" data-is="close">✕</button></div>
      <div class="is-search"><div class="cr-inp-wrap">${ICON.search}<input class="cr-in" id="isQ" placeholder="Escribe el nombre o el label: agua, cola, burger..." autocomplete="off"></div></div>
      <div class="is-filters">
        ${[['all', 'Todos'], ['drink', 'Bebidas'], ['food', 'Comida'], ['used', 'Usados en máquinas']].map(([k, t]) => `<button class="is-f ${IS.filter === k ? 'on' : ''}" data-isf="${k}">${t}</button>`).join('')}
        <span class="is-count" id="isCount"></span>
      </div>
      <div class="is-grid" id="isGrid"><div class="is-empty"><div class="spin"></div>Cargando items…</div></div>
      <div class="cr-dlg-f">
        <div class="is-manual"><span>¿No aparece? Escribe el nombre exacto:</span><input class="cr-in mono" id="isManual" placeholder="mi_item"><button class="cr-btn sm" data-is="manual">Usar</button></div>
        ${allowClear ? '<button class="cr-btn sm" data-is="clear">Ninguno</button>' : ''}
        <button class="cr-btn sm" data-is="close">Cancelar</button>
      </div></div>`;
    box.classList.remove('hidden');
    const input = q('#isQ'); input.value = IS.q; setTimeout(() => input.focus(), 30);
    input.addEventListener('input', () => { IS.q = input.value; IS.kb = -1; clearTimeout(IS.t); IS.t = setTimeout(renderItemGrid, 70); });
    input.addEventListener('keydown', itemKeys);
    box.querySelectorAll('[data-isf]').forEach((b) => b.addEventListener('click', () => { IS.filter = b.dataset.isf; box.querySelectorAll('[data-isf]').forEach((x) => x.classList.toggle('on', x === b)); IS.kb = -1; renderItemGrid(); input.focus(); }));
    box.querySelectorAll('[data-is]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.is === 'close') return closeItems();
      if (b.dataset.is === 'clear') { const cb = IS.onPick; closeItems(); cb && cb(null); return; }
      if (b.dataset.is === 'manual') {
        const v = (q('#isManual').value || '').trim();
        if (!/^[A-Za-z0-9_.:-]{1,64}$/.test(v)) { q('#isManual').classList.add('bad'); return; }
        choose(C.itemMap[v] || { name: v, label: v, image: null });
      }
    }));
    q('#isGrid').addEventListener('click', (e) => { const c = e.target.closest('[data-n]'); if (c && c.classList.contains('is-card')) choose(IS.results[+c.dataset.k]); });
    if (C.items) renderItemGrid(); else loadItems();
  }
  function closeItems() { IS.open = false; q('#crItems').classList.add('hidden'); }
  function choose(it) { if (!it) return; const cb = IS.onPick; closeItems(); SFX.key && SFX.key(); cb && cb(it); }

  function usedItems() {
    const s = new Set();
    C.machines.forEach((m) => { arr(m.products).forEach((p) => p.item && s.add(p.item)); arr(m.taps).forEach((t) => t.item && s.add(t.item)); });
    return s;
  }
  function hl(text, words) {
    let out = esc(text);
    words.forEach((w) => { if (w.length < 2) return; out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
    return out;
  }
  function renderItemGrid() {
    const grid = q('#isGrid'); if (!grid || !C.items) return;
    q('#isSub').textContent = `${C.items.length.toLocaleString('es-GT')} items en tu inventario${C.info.inventory ? ' (' + C.info.inventory + ')' : ''}`;
    const words = IS.q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
    const used = IS.filter === 'used' ? usedItems() : null;
    let list = C.items.filter((it) => {
      if (words.length && !words.every((w) => it.hay.includes(w))) return false;
      if (IS.filter === 'drink' && !DRINK_RX.test(it.hay)) return false;
      if (IS.filter === 'food' && !FOOD_RX.test(it.hay)) return false;
      if (used && !used.has(it.name)) return false;
      return true;
    });
    if (words.length) {
      const w0 = words.join(' ');
      list.sort((a, b) => score(b, w0) - score(a, w0));
    }
    const total = list.length, LIMIT = 160;
    IS.results = list.slice(0, LIMIT);
    q('#isCount').textContent = `${total.toLocaleString('es-GT')} resultado${total === 1 ? '' : 's'}`;
    if (!total) {
      grid.innerHTML = `<div class="is-empty">No encontré items con “${esc(IS.q)}”.<br>Si existe en tu servidor, escribe su nombre exacto abajo.</div>`;
      return;
    }
    grid.innerHTML = IS.results.map((it, k) => `<div class="is-card ${it.name === IS.current ? 'cur' : ''} ${k === IS.kb ? 'kb' : ''}" data-n="${esc(it.name)}" data-k="${k}" title="${esc(it.desc || '')}">
      ${itemImg(it.name)}<b>${hl(it.label, words)}</b><code>${hl(it.name, words)}</code>${it.weight ? `<span class="w">${it.weight >= 1000 ? (it.weight / 1000).toFixed(1) + ' kg' : it.weight + ' g'}</span>` : ''}</div>`).join('')
      + (total > LIMIT ? `<div class="is-more">Mostrando ${LIMIT} de ${total}. Escribe más para filtrar.</div>` : '');
  }
  function score(it, w) {
    const n = it.name.toLowerCase(), l = it.label.toLowerCase();
    if (n === w || l === w) return 100;
    if (n.startsWith(w) || l.startsWith(w)) return 50;
    return 10 - Math.min(9, n.length / 6);
  }
  function itemKeys(e) {
    const n = IS.results.length; if (!n) return;
    const grid = q('#isGrid'); const cols = Math.max(1, Math.round(grid.clientWidth / 160));
    if (e.key === 'ArrowDown') { IS.kb = Math.min(n - 1, IS.kb < 0 ? 0 : IS.kb + cols); }
    else if (e.key === 'ArrowUp') { IS.kb = Math.max(0, IS.kb - cols); }
    else if (e.key === 'ArrowRight') { IS.kb = Math.min(n - 1, IS.kb + 1); }
    else if (e.key === 'ArrowLeft') { IS.kb = Math.max(0, IS.kb - 1); }
    else if (e.key === 'Enter') { choose(IS.results[IS.kb < 0 ? 0 : IS.kb]); e.preventDefault(); return; }
    else return;
    e.preventDefault();
    grid.querySelectorAll('.is-card').forEach((c) => c.classList.toggle('kb', +c.dataset.k === IS.kb));
    const cur = grid.querySelector('.is-card.kb'); if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  /* ---------------- teclado global ---------------- */
  window.addEventListener('keydown', (e) => {
    if (!C.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!q('#crConfirm').classList.contains('hidden')) return confirmBox.res && confirmBox.res(false);
      if (IS.open) return closeItems();
      if (!q('#crKindPick').classList.contains('hidden')) return q('#crKindPick').classList.add('hidden');
      return closeCreator();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  });

  /* ---------------- mensajes del juego ---------------- */
  function applyData(d) {
    if (d.machines) C.machines = arr(d.machines);
    if (d.placements) C.placements = arr(d.placements);
    if (d.props) C.props = arr(d.props);
    if (d.drops) C.drops = arr(d.drops);
    if (d.symbol) C.symbol = d.symbol;
    if (d.maxCredit) C.maxCredit = d.maxCredit;
    if (d.info) C.info = d.info;
  }
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.action === 'creator') {
      applyData(d);
      C.open = true; C.items = null; C.itemsLoading = false; C.itemMap = {}; C.modelStatus = {};
      if (C.curId) { const m = C.machines.find((x) => x.id === C.curId); C.cur = m ? norm(m) : null; if (!m) C.curId = null; C.dirty = false; }
      shell();
      const inf = C.info || {};
      q('#crInfo').innerHTML = `Framework: <i>${esc(inf.framework || '?')}</i> · Inventario: <i>${esc(inf.inventory || '?')}</i> · Se guarda en <i>data/creator.json</i>`;
      root.classList.remove('hidden');
      renderAll();
      loadItems();
      if (C.cur) checkModels(C.cur.models);
    } else if (d.action === 'creatorShow') {
      applyData(d);
      C.open = true; root.classList.remove('hidden');
      if (d.tab) C.tab = d.tab;
      renderAll();
      if (d.msg) flash(d.msg, d.msgType || 'ok');
    } else if (d.action === 'creatorHide') {
      C.open = false; root.classList.add('hidden');
    } else if (d.action === 'creatorItems') {
      setItems(d.items);
    }
  });

  /* =====================================================================
     MODO PRUEBA (index.html?m=creator en el navegador)
     ===================================================================== */
  if (typeof IN_GAME !== 'undefined' && !IN_GAME && new URLSearchParams(location.search).get('m') === 'creator') {
    const P = (model, label, kind) => ({ model, label, kind });
    const mockMachines = [
      { id: 'ecola', origin: 'config', type: 'vending', label: 'Máquina de bebidas', brand: 'eCola', color: '#b3141c', logo: 'script', models: ['prop_vend_soda_01'], spot: { x: -0.1, y: 0.22 },
        products: [{ item: 'ecola', label: 'eCola', price: 3, prop: 'prop_ecola_can', color: '#c8102e' }, { item: 'ecola_light', label: 'eCola Light', price: 3, prop: 'prop_ecola_can', color: '#d9d9d9' }, { item: 'sprunk', label: 'Sprunk', price: 3, prop: 'prop_ld_can_01', color: '#1f9e3a' }, { item: 'orangotang', label: 'Orang-O-Tang', price: 3, prop: 'prop_orang_can_01', color: '#f08a00' }, { item: 'water', label: 'Agua Pura', price: 2, prop: 'prop_ld_flow_bottle', color: '#3aa0ff' }] },
      { id: 'cafe', origin: 'config', type: 'coffee', label: 'Máquina de café', brand: 'Bean Machine', color: '#6b4226', logo: 'clean', sugar: true, models: ['prop_vend_coffe_01'], cupProp: 'p_amb_coffeecup_01',
        products: [{ item: 'coffee', label: 'Café Negro', price: 3, color: '#3b2314' }, { item: 'cappuccino', label: 'Capuchino', price: 5, color: '#d8b48a' }] },
      { id: 'fuente', origin: 'override', type: 'dispenser', style: 'fountain', label: 'Fuente de sodas', brand: 'eCola', color: '#c8102e', logo: 'script', models: ['prop_food_bs_soda_01'], cupProp: 'ng_proc_sodacup_01a',
        cups: [{ label: 'Chico', price: 2, ml: 350 }, { label: 'Grande', price: 4, ml: 750 }], taps: [{ label: 'Sprunk', item: 'sprunk', color: '#1f9e3a' }, { label: 'HIELO', ice: true, color: '#cfeeff' }, { label: 'eCola', item: 'ecola', color: '#5a1a0e' }] },
      { id: 'pisswasser_bar', origin: 'custom', type: 'vending', label: 'Máquina de cerveza', brand: 'Pißwasser', color: '#f2b705', logo: 'bold', models: [], prop: 'prop_vend_soda_02',
        products: [{ item: 'beer', label: 'Pißwasser', price: 5, prop: 'prop_amb_beer_bottle', color: '#f2b705', shape: 'bottle' }, { item: 'water', label: 'Agua', price: 2, prop: 'prop_ld_flow_bottle', color: '#3aa0ff' }] },
    ];
    let mockPl = [{ id: 1, machine: 'pisswasser_bar', kind: 'prop', model: 'prop_vend_soda_02', x: 25.71, y: -1346.2, z: 28.5, h: 270 }, { id: 2, machine: 'fuente', kind: 'zone', x: 1135.8, y: -982.3, z: 46.4, h: 96, counter: 0.92 }];
    const mockItems = [
      ['water', 'Agua'], ['ecola', 'eCola'], ['ecola_light', 'eCola Light'], ['sprunk', 'Sprunk'], ['sprunk_light', 'Sprunk Light'], ['orangotang', 'Orang-O-Tang'],
      ['coffee', 'Café'], ['cappuccino', 'Capuchino'], ['hot_chocolate', 'Chocolate caliente'], ['tea', 'Té'], ['beer', 'Cerveza Pißwasser'], ['whiskey', 'Whiskey'],
      ['vodka', 'Vodka'], ['energy_drink', 'Bebida energética'], ['juice_orange', 'Jugo de naranja'], ['juice_strawberry', 'Jugo de fresa'], ['slush_green', 'Granizada lima'], ['slush_blue', 'Granizada mora'],
      ['burger', 'Hamburguesa'], ['sandwich', 'Sándwich'], ['taco', 'Taco'], ['donut', 'Dona'], ['egochaser', 'Ego Chaser'], ['meteorite', 'Meteorite'], ['pqs', "P's & Q's"], ['chips', 'Papas fritas'],
      ['phone', 'Teléfono'], ['radio', 'Radio'], ['lockpick', 'Ganzúa'], ['bandage', 'Venda'], ['money', 'Dinero'], ['weapon_pistol', 'Pistola'], ['repairkit', 'Kit de reparación'], ['milk', 'Leche'],
    ].map(([name, label], i) => ({ name, label, weight: 100 + (i % 5) * 150, image: null }));
    window.mockPost = async (name, data) => {
      await new Promise((r) => setTimeout(r, 90));
      const send = (m, t = 0) => setTimeout(() => window.postMessage(m, '*'), t);
      if (!name.startsWith('creator:')) return mock(name, data);
      if (name === 'creator:items') { send({ action: 'creatorItems', items: mockItems }, 500); return { ok: true }; }
      if (name === 'creator:checkModel') return { ok: /^(prop_|p_|ng_|v_)/.test(String(data.model)) };
      if (name === 'creator:save') {
        const d = clone(data); const old = d.oldId; delete d.oldId;
        const i = mockMachines.findIndex((x) => x.id === (old || d.id));
        d.origin = i >= 0 ? mockMachines[i].origin === 'config' ? 'override' : mockMachines[i].origin : 'custom';
        if (i >= 0) mockMachines[i] = d; else mockMachines.push(d);
        if (old && old !== d.id) mockPl.forEach((p) => { if (p.machine === old) p.machine = d.id; });
        return { ok: true, id: d.id, machines: clone(mockMachines), placements: clone(mockPl) };
      }
      if (name === 'creator:delete') {
        const i = mockMachines.findIndex((x) => x.id === data.id);
        if (i >= 0) mockMachines.splice(i, 1);
        mockPl = mockPl.filter((p) => p.machine !== data.id);
        return { ok: true, machines: clone(mockMachines), placements: clone(mockPl) };
      }
      if (name === 'creator:removePlacement') { mockPl = mockPl.filter((p) => p.id !== data.pid); return { ok: true, placements: clone(mockPl) }; }
      if (name === 'creator:place' || name === 'creator:zone') {
        const id = Math.max(0, ...mockPl.map((p) => p.id)) + 1;
        mockPl.push({ id, machine: data.id, kind: name === 'creator:zone' ? 'zone' : 'prop', model: name === 'creator:zone' ? undefined : data.model, x: 100 + id, y: -200 - id, z: 30, h: 90 });
        send({ action: 'creatorShow', placements: clone(mockPl), tab: 'place', msg: `Máquina colocada (#${id}).`, msgType: 'ok' }, 900);
        return { ok: true };
      }
      if (name === 'creator:tp') { send({ action: 'creatorShow' }, 900); return { ok: true }; }
      if (name === 'creator:close') { send({ action: 'creator', machines: clone(mockMachines), placements: clone(mockPl), props: mockProps, drops: mockDrops, symbol: 'Q', maxCredit: 20, info: { framework: 'demo', inventory: 'demo' } }, 1200); return { ok: true }; }
      return { ok: true };
    };
    const mockProps = [P('prop_vend_soda_01', 'Vending roja (eCola)', 'vending'), P('prop_vend_soda_02', 'Vending verde (Sprunk)', 'vending'), P('prop_vend_water_01', 'Vending de agua', 'vending'), P('prop_vend_snak_01', 'Vending de snacks', 'vending'), P('prop_vend_coffe_01', 'Café Bean Machine', 'coffee'), P('prop_food_bs_soda_01', 'Fuente Burger Shot', 'dispenser'), P('prop_slush_dispenser', 'Granizadora', 'dispenser'), P('prop_juice_dispenser', 'Dispensador de jugos', 'dispenser')];
    const mockDrops = [{ prop: 'prop_ecola_can', label: 'Lata eCola', shape: 'can' }, { prop: 'prop_ld_can_01', label: 'Lata Sprunk', shape: 'can' }, { prop: 'prop_orang_can_01', label: 'Lata Orang-O-Tang', shape: 'can' }, { prop: 'prop_ld_flow_bottle', label: 'Botella de agua', shape: 'bottle' }, { prop: 'prop_amb_beer_bottle', label: 'Botella de cerveza', shape: 'bottle' }, { prop: 'prop_choc_ego', label: 'Chocolate', shape: 'snack' }, { prop: 'p_amb_coffeecup_01', label: 'Vaso de café', shape: 'cup' }, { prop: 'ng_proc_sodacup_01a', label: 'Vaso de soda', shape: 'cup' }];
    document.body.style.background = 'radial-gradient(circle at 30% 40%, #5a5e63, #1b1c1f)';
    setTimeout(() => window.postMessage({ action: 'creator', machines: clone(mockMachines), placements: clone(mockPl), props: mockProps, drops: mockDrops, symbol: 'Q', maxCredit: 20, info: { framework: 'qb', inventory: 'ox_inventory' } }, '*'), 50);
  }
})();
