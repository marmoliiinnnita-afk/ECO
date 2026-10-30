import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, collection, query, orderBy,
  onSnapshot, writeBatch, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig, ADMIN_EMAIL_DOMAIN } from './firebase-config.js';
import { QUESTIONS, OPTIONS } from './questions.js';
import { calcular, NEGATIVOS, LEYENDA_NIVELES } from './score.js';
import { RANGOS } from './interpretaciones.js';

/* ───────────── utilidades ───────────── */
const $app = document.getElementById('app');
const $dlg = document.getElementById('dlg');
const $toast = document.getElementById('toast');
const PER_PAGE = 10;
const MAX_LINKS = 20; // máximo de enlaces únicos que se pueden tener creados
const TOTAL = QUESTIONS.length;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 3200);
}

function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return '—';
  return d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

// Nombre de archivo sin acentos ni símbolos raros (Pérez Núñez -> Perez_Nunez)
const fileSafe = (n) => String(n || 'sin-nombre').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'sin-nombre';

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function baseUrl() {
  return location.origin + location.pathname.replace(/index\.html$/, '');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('Enlace copiado');
}

function openDialog(html) {
  $dlg.innerHTML = `<div class="dlg-body">${html}</div>`;
  if (!$dlg.open) $dlg.showModal();
}
function closeDialog() { if ($dlg.open) $dlg.close(); }
$dlg.addEventListener('click', (e) => {
  if (e.target === $dlg || e.target.closest('[data-close]')) closeDialog();
});

function confirmDialog(title, text, okText, danger = false) {
  return new Promise((resolve) => {
    openDialog(`
      <h2>${esc(title)}</h2>
      <p class="muted">${esc(text)}</p>
      <div class="dlg-actions">
        <button class="btn ghost" id="c-no">Cancelar</button>
        <button class="btn ${danger ? 'danger' : ''}" id="c-yes">${esc(okText)}</button>
      </div>`);
    const done = (v) => { $dlg.removeEventListener('close', onClose); closeDialog(); resolve(v); };
    const onClose = () => resolve(false);
    $dlg.addEventListener('close', onClose, { once: true });
    $dlg.querySelector('#c-no').onclick = () => done(false);
    $dlg.querySelector('#c-yes').onclick = () => done(true);
  });
}

const LOGO = `<div class="logo"><svg viewBox="0 0 24 24"><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M8 6H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2"/><path d="m9 14 2 2 4-4"/></svg></div>`;

function viewMessage(icon, title, text) {
  $app.innerHTML = `
    <div class="center-screen"><div class="card narrow center">
      <div class="bigicon">${icon}</div>
      <h1>${esc(title)}</h1>
      <p class="muted">${text}</p>
    </div></div>`;
}

function viewLoading() {
  $app.innerHTML = `<div class="center-screen"><div class="center"><div class="spinner"></div><p class="muted">Cargando…</p></div></div>`;
}

/* ───────────── inicio ───────────── */
const configured = firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('PEGA');
const token = new URLSearchParams(location.search).get('t');

/* ── Actualización automática ──
   Busca una versión nueva al abrir, al volver a la app y cada 15 min. Cuando el service worker
   nuevo toma el control, recarga la página sola (una vez). El progreso del cuestionario y la
   sesión se guardan en el navegador y se conservan: no hace falta borrar datos del sitio. */
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  let pendingReload = false;

  const userIsTyping = () => {
    const a = document.activeElement;
    return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.type !== 'radio' && a.type !== 'checkbox' && !!a.value;
  };
  const doReload = () => { if (!reloading) { reloading = true; location.reload(); } };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // primera instalación: no hace falta recargar
    // Si alguien está escribiendo o hay un diálogo abierto, espera a que salga de la app.
    if (userIsTyping() || document.querySelector('dialog[open]')) pendingReload = true;
    else doReload();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pendingReload) doReload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        const check = () => reg.update().catch(() => {});
        check();
        setInterval(check, 15 * 60 * 1000);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
        window.addEventListener('online', check);
      })
      .catch(() => {});
  });
}

if (!configured) {
  $app.innerHTML = `
    <div class="center-screen"><div class="card narrow">
      ${LOGO}
      <h1>Falta configurar Firebase</h1>
      <p class="muted">Abre <b>public/firebase-config.js</b> y pega los datos de tu proyecto (README, paso 4). Después vuelve a subir la app.</p>
    </div></div>`;
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (token) runTest(db, token);
  else runAdmin(auth, db);
}

/* ═════════════════════════════════════════════════════════════
   LADO DEL ENCUESTADO (enlace único)
   ═════════════════════════════════════════════════════════════ */
async function runTest(db, token) {
  viewLoading();
  const LS = 'cq_' + token;
  let test;
  try {
    const snap = await getDoc(doc(db, 'tests', token));
    if (!snap.exists()) {
      return viewMessage('🔍', 'Enlace no válido', 'Este enlace no existe o fue eliminado. Pide uno nuevo a quien te lo envió.');
    }
    test = snap.data();
  } catch {
    return viewMessage('📡', 'No se pudo cargar', 'Revisa tu conexión a internet e intenta de nuevo.');
  }
  if (test.status === 'completed') {
    localStorage.removeItem(LS);
    return viewMessage('🔒', 'Enlace ya utilizado', 'Este cuestionario ya fue respondido y el enlace dejó de funcionar.');
  }

  // Progreso guardado en este dispositivo (si cierran sin querer, no pierden respuestas)
  let answers = new Array(TOTAL).fill(0);
  let page = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(LS) || 'null');
    if (saved && Array.isArray(saved.answers) && saved.answers.length === TOTAL) {
      answers = saved.answers.map((n) => (n >= 1 && n <= 5 ? n : 0));
      page = Math.min(Math.max(saved.page | 0, 0), Math.ceil(TOTAL / PER_PAGE) - 1);
    }
  } catch { /* sin progreso previo */ }
  const save = () => { try { localStorage.setItem(LS, JSON.stringify({ answers, page })); } catch { /* ignorar */ } };
  const answered = () => answers.filter(Boolean).length;
  const pages = Math.ceil(TOTAL / PER_PAGE);

  const legendHtml = `<div class="legend">${OPTIONS.map((o) => `<div><b>${o.value}</b>${esc(o.label)}</div>`).join('')}</div>`;

  function viewIntro() {
    const started = answered() > 0;
    $app.innerHTML = `
      <div class="center-screen"><div class="card narrow">
        ${LOGO}
        <h1>${test.label ? 'Hola, ' + esc(test.label) : 'Cuestionario'}</h1>
        <p>Vas a responder <b>${TOTAL} afirmaciones</b>. Para cada una elige <b>una sola opción</b>:</p>
        ${legendHtml}
        <p class="muted small" style="margin-top:14px">No hay respuestas buenas ni malas: contesta con sinceridad. Tu avance se guarda en este dispositivo. Este enlace es de <b>un solo uso</b>: al finalizar ya no podrá abrirse otra vez.</p>
        <button class="btn block" id="start">${started ? 'Continuar (' + answered() + '/' + TOTAL + ')' : 'Comenzar'}</button>
      </div></div>`;
    document.getElementById('start').onclick = () => viewPage();
  }

  function viewPage() {
    const start = page * PER_PAGE;
    const slice = QUESTIONS.slice(start, start + PER_PAGE);
    const last = page === pages - 1;
    $app.innerHTML = `
      <div class="qhead"><div class="inner">
        <div class="line"><span>Página ${page + 1} de ${pages}</span><span id="cnt"></span></div>
        <div class="bar"><i id="bar"></i></div>
      </div></div>
      <div class="wrap">
        <div class="card" style="padding:12px">${legendHtml}</div>
        ${slice.map((text, i) => {
          const n = start + i;
          return `
          <section class="q" id="q${n}" data-n="${n}">
            <div class="text"><span class="n">${n + 1}.</span>${esc(text)}</div>
            <div class="opts" role="radiogroup" aria-label="Pregunta ${n + 1}">
              ${OPTIONS.map((o) => `
                <label class="opt">
                  <input type="radio" name="q${n}" value="${o.value}" ${answers[n] === o.value ? 'checked' : ''}>
                  <span>${o.value}<small>${esc(o.label)}</small></span>
                </label>`).join('')}
            </div>
            <div class="picked" id="p${n}">${answers[n] ? esc(OPTIONS[answers[n] - 1].label) : ''}</div>
          </section>`;
        }).join('')}
        <div class="qnav">
          ${page > 0 ? '<button class="btn ghost" id="prev">← Anterior</button>' : ''}
          <button class="btn ${last ? 'green' : ''}" id="next">${last ? 'Finalizar ✓' : 'Siguiente →'}</button>
        </div>
      </div>`;
    updateProgress();
    window.scrollTo(0, 0);

    $app.querySelectorAll('.opt input').forEach((inp) => {
      inp.addEventListener('change', () => {
        const n = +inp.name.slice(1);
        answers[n] = +inp.value;
        document.getElementById('q' + n).classList.remove('missing');
        document.getElementById('p' + n).textContent = OPTIONS[answers[n] - 1].label;
        save();
        updateProgress();
      });
    });
    const prev = document.getElementById('prev');
    if (prev) prev.onclick = () => { page--; save(); viewPage(); };
    document.getElementById('next').onclick = () => (last ? finish() : next());
  }

  function updateProgress() {
    const a = answered();
    const cnt = document.getElementById('cnt');
    const bar = document.getElementById('bar');
    if (cnt) cnt.textContent = `${a} / ${TOTAL} respondidas`;
    if (bar) bar.style.width = (a / TOTAL * 100) + '%';
  }

  function firstMissingOnPage() {
    const start = page * PER_PAGE;
    for (let n = start; n < Math.min(start + PER_PAGE, TOTAL); n++) if (!answers[n]) return n;
    return -1;
  }

  function flagMissing(n) {
    const el = document.getElementById('q' + n);
    if (!el) return;
    // marcar todas las faltantes de la página
    const start = page * PER_PAGE;
    for (let k = start; k < Math.min(start + PER_PAGE, TOTAL); k++) {
      if (!answers[k]) document.getElementById('q' + k)?.classList.add('missing');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Responde todas las preguntas de esta página');
  }

  function next() {
    const m = firstMissingOnPage();
    if (m >= 0) return flagMissing(m);
    page++;
    save();
    viewPage();
  }

  async function finish() {
    const m = firstMissingOnPage();
    if (m >= 0) return flagMissing(m);
    const idx = answers.findIndex((v) => !v);
    if (idx >= 0) {
      page = Math.floor(idx / PER_PAGE);
      save();
      viewPage();
      toast('Te faltó la pregunta ' + (idx + 1));
      return;
    }
    const ok = await confirmDialog('¿Finalizar cuestionario?', 'Después de enviar ya no podrás cambiar tus respuestas ni volver a abrir este enlace.', 'Sí, enviar', false);
    if (!ok) return;
    await submit();
  }

  async function submit() {
    const btn = document.getElementById('next');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
    const reset = () => { if (btn) { btn.disabled = false; btn.textContent = 'Finalizar ✓'; } };

    if (!navigator.onLine) { toast('Sin internet. Conéctate e intenta de nuevo.'); return reset(); }

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'results', token), { answers: answers.slice(), completedAt: serverTimestamp() });
      batch.update(doc(db, 'tests', token), { status: 'completed', completedAt: serverTimestamp() });
      await Promise.race([
        batch.commit(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000))
      ]);
      return viewDone();
    } catch {
      // ¿Se envió aunque haya fallado la respuesta?
      try {
        const s = await getDoc(doc(db, 'tests', token));
        if (s.exists() && s.data().status === 'completed') return viewDone();
      } catch { /* sin conexión */ }
      toast('No se pudo enviar. Revisa tu internet e intenta de nuevo.');
      reset();
    }
  }

  function viewDone() {
    try { localStorage.removeItem(LS); } catch { /* ignorar */ }
    viewMessage('✅', 'Respuestas enviadas', 'Sus respuestas han sido enviadas para su revisión y el enlace único ya no se podrá utilizar. Ya puede cerrar esta ventana.');
    window.scrollTo(0, 0);
  }

  viewIntro();
}

/* ═════════════════════════════════════════════════════════════
   LADO DEL ADMINISTRADOR (manu)
   ═════════════════════════════════════════════════════════════ */
function runAdmin(auth, db) {
  let unsub = [];
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    document.getElementById('install')?.removeAttribute('hidden');
  });

  onAuthStateChanged(auth, (user) => {
    unsub.forEach((u) => u());
    unsub = [];
    if (user) viewAdmin(user); else viewLogin();
  });

  function viewLogin(error = '') {
    $app.innerHTML = `
      <div class="center-screen"><form class="card narrow" id="f" autocomplete="on">
        ${LOGO}
        <h1>Acceso</h1>
        <p class="muted">Ingresa para administrar tus cuestionarios.</p>
        ${error ? `<div class="msg err">${esc(error)}</div>` : ''}
        <label class="field">Usuario
          <input type="text" id="u" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required>
        </label>
        <label class="field">Contraseña
          <input type="password" id="p" name="password" autocomplete="current-password" required>
        </label>
        <button class="btn block" id="go">Entrar</button>
      </form></div>`;
    document.getElementById('f').onsubmit = async (e) => {
      e.preventDefault();
      const u = document.getElementById('u').value.trim().toLowerCase();
      const p = document.getElementById('p').value;
      const btn = document.getElementById('go');
      btn.disabled = true; btn.textContent = 'Entrando…';
      try {
        await signInWithEmailAndPassword(auth, `${u}@${ADMIN_EMAIL_DOMAIN}`, p);
      } catch (err) {
        const bad = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'];
        viewLogin(bad.includes(err.code) ? 'Usuario o contraseña incorrectos.'
          : err.code === 'auth/too-many-requests' ? 'Demasiados intentos. Espera unos minutos.'
          : err.code === 'auth/network-request-failed' ? 'Sin conexión a internet.'
          : 'No se pudo iniciar sesión (' + (err.code || 'error') + ').');
      }
    };
  }

  function viewAdmin(user) {
    let tests = [];
    let results = {};
    let firstLoad = true;
    let lastCreated = null;

    $app.innerHTML = `
      <div class="wrap">
        <div class="topbar">
          <div><h1 style="margin:0">Cuestionarios</h1><span class="muted small">Sesión: ${esc(user.email.split('@')[0])}</span></div>
          <div class="actions">
            <button class="btn ghost sm" id="install" hidden>Instalar app</button>
            <button class="btn ghost sm" id="out">Salir</button>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><b id="s-all">0</b><span>Enviados</span></div>
          <div class="stat"><b id="s-pend">0</b><span>Pendientes</span></div>
          <div class="stat"><b id="s-done">0</b><span>Contestados</span></div>
        </div>
        <div class="card">
          <h2>Nuevo enlace</h2>
          <p class="muted small">Escribe el nombre de quien lo va a responder (para que lo identifiques) y crea el enlace de un solo uso. <b id="quota"></b></p>
          <form class="row-form" id="new">
            <input type="text" id="label" placeholder="Nombre o etiqueta" maxlength="80" autocomplete="off">
            <button class="btn" id="mk">Crear</button>
          </form>
          <div id="created"></div>
        </div>
        <div class="card">
          <h2>Historial</h2>
          <div id="list"><div class="empty">Cargando…</div></div>
        </div>
      </div>`;

    document.getElementById('out').onclick = () => signOut(auth);
    const inst = document.getElementById('install');
    if (deferredInstall) inst.hidden = false;
    inst.onclick = async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
      inst.hidden = true;
    };

    document.getElementById('new').onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById('label');
      const label = input.value.trim();
      const btn = document.getElementById('mk');
      if (tests.length >= MAX_LINKS) {
        toast(`Ya tienes ${MAX_LINKS} enlaces. Elimina alguno para crear otro.`);
        return;
      }
      btn.disabled = true;
      const t = newToken();
      try {
        await setDoc(doc(db, 'tests', t), { label, status: 'pending', createdAt: serverTimestamp() });
        input.value = '';
        lastCreated = { token: t, label };
        renderCreated();
      } catch {
        toast('No se pudo crear el enlace. Revisa tu conexión.');
      }
      btn.disabled = false;
    };

    function linkFor(t) { return `${baseUrl()}?t=${t}`; }
    function shareText(label, url) {
      return `Hola${label ? ' ' + label : ''}, por favor responde este cuestionario. El enlace es de un solo uso:\n${url}`;
    }

    function renderCreated() {
      const box = document.getElementById('created');
      if (!lastCreated) { box.innerHTML = ''; return; }
      const url = linkFor(lastCreated.token);
      box.innerHTML = `
        <div class="linkbox">
          <b>✅ Enlace listo${lastCreated.label ? ' para ' + esc(lastCreated.label) : ''}</b>
          <code>${esc(url)}</code>
          <div class="btns">
            <button class="btn sm" id="cp">Copiar</button>
            <button class="btn sm green" id="wa">WhatsApp</button>
            ${navigator.share ? '<button class="btn sm ghost" id="sh">Compartir…</button>' : ''}
          </div>
        </div>`;
      document.getElementById('cp').onclick = () => copyText(url);
      document.getElementById('wa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(shareText(lastCreated.label, url)), '_blank', 'noopener');
      const sh = document.getElementById('sh');
      if (sh) sh.onclick = () => navigator.share({ text: shareText(lastCreated.label, url) }).catch(() => {});
    }

    function renderList() {
      const done = tests.filter((t) => t.status === 'completed').length;
      document.getElementById('s-all').textContent = tests.length;
      document.getElementById('s-done').textContent = done;
      document.getElementById('s-pend').textContent = tests.length - done;
      const full = tests.length >= MAX_LINKS;
      document.getElementById('quota').textContent = `Enlaces: ${tests.length} de ${MAX_LINKS}${full ? ' (límite alcanzado; elimina uno para crear otro)' : ''}.`;
      document.getElementById('mk').disabled = full;
      const list = document.getElementById('list');
      if (!tests.length) { list.innerHTML = '<div class="empty">Aún no has creado enlaces.</div>'; return; }
      list.innerHTML = tests.map((t) => {
        const isDone = t.status === 'completed';
        const r = results[t.id];
        const calc = isDone && r ? calcular(r.answers) : null;
        const score = calc ? calc.total : null;
        const invalid = calc ? calc.indices.invalida : false;
        return `
        <div class="item" data-id="${esc(t.id)}">
          <div class="head">
            <div>
              <div class="name">${esc(t.label || 'Sin nombre')}</div>
              <div class="muted small">${isDone ? 'Contestado: ' + fmtDate(t.completedAt) : 'Creado: ' + fmtDate(t.createdAt)}</div>
            </div>
            <div style="text-align:right">
              <span class="badge ${isDone ? 'done' : 'pending'}">${isDone ? 'Contestado' : 'Pendiente'}</span>
              ${score !== null ? `<div class="score-pill">${score} pts</div>` : ''}
              ${invalid ? '<div class="badge inval">Prueba inválida</div>' : ''}
            </div>
          </div>
          <div class="btns">
            ${isDone
              ? `<button class="btn sm" data-act="view">Ver resultado</button>`
              : `<button class="btn sm ghost" data-act="copy">Copiar enlace</button>
                 <button class="btn sm ghost" data-act="wa">WhatsApp</button>`}
            <button class="btn sm danger" data-act="del">Eliminar</button>
          </div>
        </div>`;
      }).join('');
    }

    document.getElementById('list').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const id = b.closest('.item').dataset.id;
      const t = tests.find((x) => x.id === id);
      if (!t) return;
      const act = b.dataset.act;
      if (act === 'copy') return copyText(linkFor(id));
      if (act === 'wa') return window.open('https://wa.me/?text=' + encodeURIComponent(shareText(t.label, linkFor(id))), '_blank', 'noopener');
      if (act === 'view') return showResult(t, results[id]);
      if (act === 'del') {
        const ok = await confirmDialog('¿Eliminar?', `Se borrará ${t.label ? '"' + t.label + '"' : 'este registro'}${t.status === 'completed' ? ' junto con sus resultados' : ' y su enlace dejará de funcionar'}. No se puede deshacer.`, 'Eliminar', true);
        if (!ok) return;
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'tests', id));
          batch.delete(doc(db, 'results', id));
          await batch.commit();
          toast('Eliminado');
        } catch { toast('No se pudo eliminar.'); }
      }
    });

    const IDX_NAMES = {
      inconsistencia: 'Inconsistencia',
      impresion: 'Impresión positiva',
      involucramiento: 'Involucramiento'
    };

    function validezHtml(c) {
      const x = c.indices;
      const chips = Object.keys(IDX_NAMES).map((k) => {
        const v = x[k];
        const cls = v.pendiente ? 'na' : v.invalida ? 'bad' : 'ok';
        const val = v.pendiente ? 'Pendiente' : v.valor;
        const note = v.pendiente ? 'faltan los 10 pares' : (v.invalida ? 'INVÁLIDA' : 'aceptable') + ` (límite ${v.limite})`;
        return `<div class="idx ${cls}"><small>${IDX_NAMES[k]}</small><b>${val}</b><small>${note}</small></div>`;
      }).join('');
      const razones = Object.keys(IDX_NAMES).filter((k) => x[k].invalida).map((k) => IDX_NAMES[k]);
      const banner = x.invalida
        ? `<div class="msg err"><b>Prueba inválida</b> por: ${razones.join(', ')}. No se deben interpretar los resultados.</div>`
        : x.pendiente
          ? `<div class="msg warn">El índice de inconsistencia aún no se puede calcular (faltan los 10 pares de reactivos). Los otros dos índices están dentro del límite.</div>`
          : '<div class="msg ok">Los tres índices de validez están dentro del límite.</div>';
      return `<h3 style="margin-top:14px">Índices de validez</h3>${banner}<div class="idxs">${chips}</div>`;
    }

    function showResult(t, r) {
      if (!r) { toast('Cargando resultados… intenta de nuevo en un momento.'); return; }
      const c = calcular(r.answers);
      const lvl = (s) => (s.nivel ? ` · Nivel ${s.nivel}` : '');
      openDialog(`
        <h2>${esc(t.label || 'Sin nombre')}</h2>
        <p class="muted small">Contestado: ${fmtDate(t.completedAt)}</p>
        ${validezHtml(c)}
        <div class="big-score"><b>${c.total}</b><span class="muted">de ${c.max} puntos · promedio ${c.avg.toFixed(2)}</span></div>
        ${c.metas.map((m) => `
          <div class="meta">
            <div class="meta-head"><span>${esc(m.name)}</span><b>${m.sum} / ${m.max}${lvl(m)}</b></div>
            <div class="bar"><i style="width:${(m.sum / m.max * 100).toFixed(1)}%"></i></div>
            <table class="scales">${m.comps.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.sum} / ${s.max} · <span class="chip ${s.rango}">${s.etiqueta}</span></td></tr>`).join('')}</table>
          </div>`).join('')}
        <p class="muted small" style="margin-top:12px">Rangos por competencia: Bajo ${RANGOS.bajo.min}-${RANGOS.bajo.max} · Medio ${RANGOS.medio.min}-${RANGOS.medio.max} · Alto ${RANGOS.alto.min}-${RANGOS.alto.max}.${c.metas.some((m) => m.nivel) ? ' ' + esc(LEYENDA_NIVELES) : ''}</p>
        <details class="ans" open><summary>Interpretación por competencia</summary>
          ${c.metas.map((m) => m.comps.map((s) => `
            <div class="interp ${s.rango}">
              <div class="interp-head"><b>${esc(s.name)}</b><span class="chip ${s.rango}">${s.etiqueta} · ${s.sum}/${s.max}</span></div>
              <p>${esc(s.texto)}</p>
            </div>`).join('')).join('')}
        </details>
        <details class="ans"><summary>Ver respuestas una por una</summary>
          <div class="ans-list">${r.answers.map((v, i) => `<div><b>${i + 1}</b><span>${esc(QUESTIONS[i])} → <b>${v}</b>${NEGATIVOS.has(i + 1) ? ' <i class="muted">(invertido: ' + (6 - v) + ')</i>' : ''}</span></div>`).join('')}</div>
        </details>
        <div class="dlg-actions">
          <button class="btn ghost" id="csv">CSV</button>
          <button class="btn ghost" data-close>Cerrar</button>
          <button class="btn" id="pdf">Descargar PDF</button>
        </div>`);
      $dlg.querySelector('#csv').onclick = () => downloadCsv(t, r, c);
      $dlg.querySelector('#pdf').onclick = (e) => downloadPdf(t, r, c, e.currentTarget);
    }

    function loadJsPdf() {
      if (window.jspdf) return Promise.resolve(window.jspdf);
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = () => resolve(window.jspdf);
        s.onerror = () => reject(new Error('jspdf'));
        document.head.appendChild(s);
      });
    }

    async function downloadPdf(t, r, c, btn) {
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = 'Generando…';
      let lib;
      try { lib = await loadJsPdf(); } catch {
        toast('No se pudo generar el PDF. Revisa tu conexión.');
        btn.disabled = false; btn.textContent = prev;
        return;
      }
      const pdf = new lib.jsPDF({ unit: 'mm', format: 'a4' });
      const W = 210, M = 16, R = W - M;
      let y = 0;
      const ensure = (h) => { if (y + h > 280) { pdf.addPage(); y = 18; } };
      const bar = (x, yy, w, frac, h) => {
        pdf.setFillColor(227, 229, 241); pdf.roundedRect(x, yy, w, h, h / 2, h / 2, 'F');
        if (frac > 0) { pdf.setFillColor(79, 70, 229); pdf.roundedRect(x, yy, Math.max(w * frac, h), h, h / 2, h / 2, 'F'); }
      };

      // ── Encabezado con el nombre de quien respondió
      pdf.setFillColor(79, 70, 229); pdf.rect(0, 0, W, 38, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
      pdf.text('Resultados del cuestionario', M, 12);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(17);
      pdf.text(pdf.splitTextToSize(t.label || 'Sin nombre', W - 2 * M)[0], M, 22);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      pdf.text(`Contestado: ${fmtDate(t.completedAt)}`, M, 31);

      // ── Índices de validez
      y = 48;
      pdf.setTextColor(67, 56, 202); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
      pdf.text('Índices de validez', M, y);
      y += 6;
      const x = c.indices;
      const colW = (W - 2 * M - 8) / 3;
      Object.keys(IDX_NAMES).forEach((k, i) => {
        const v = x[k];
        const bx = M + i * (colW + 4);
        const [fr, fg, fb] = v.pendiente ? [240, 240, 245] : v.invalida ? [253, 234, 236] : [228, 246, 236];
        const [tr, tg, tb] = v.pendiente ? [110, 114, 135] : v.invalida ? [192, 41, 59] : [19, 138, 85];
        pdf.setFillColor(fr, fg, fb); pdf.roundedRect(bx, y, colW, 22, 2.5, 2.5, 'F');
        pdf.setTextColor(60, 64, 90); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
        pdf.text(IDX_NAMES[k], bx + 3, y + 5.5);
        pdf.setTextColor(tr, tg, tb); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15);
        pdf.text(v.pendiente ? 'Pendiente' : String(v.valor), bx + 3, y + 14);
        pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
        pdf.text(v.pendiente ? 'faltan los 10 pares' : (v.invalida ? 'INVÁLIDA' : 'Aceptable') + ` (límite ${v.limite})`, bx + 3, y + 19.5);
      });
      y += 28;
      if (x.invalida) {
        const razones = Object.keys(IDX_NAMES).filter((k) => x[k].invalida).map((k) => IDX_NAMES[k]).join(', ');
        pdf.setFillColor(192, 41, 59); pdf.roundedRect(M, y, W - 2 * M, 10, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
        pdf.text(`PRUEBA INVÁLIDA (${razones}). No interpretar los resultados.`, M + 4, y + 6.5);
        y += 16;
      } else if (x.pendiente) {
        pdf.setTextColor(150, 90, 10); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
        pdf.text('El índice de inconsistencia aún no se calcula (faltan los 10 pares de reactivos).', M, y + 2);
        y += 9;
      } else { y += 2; }

      // ── Total
      ensure(32);
      pdf.setFillColor(238, 240, 255); pdf.roundedRect(M, y, W - 2 * M, 22, 3, 3, 'F');
      pdf.setTextColor(67, 56, 202); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(24);
      pdf.text(String(c.total), M + 8, y + 15);
      pdf.setFontSize(10.5); pdf.setTextColor(60, 64, 90);
      pdf.text(`Puntaje total (de ${c.max} puntos)`, M + 45, y + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Promedio general: ${c.avg.toFixed(2)} de 5`, M + 45, y + 17);
      y += 32;

      // ── Competencias
      ensure(12);
      pdf.setTextColor(67, 56, 202); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
      pdf.text('Resultados por competencia', M, y);
      y += 8;
      c.metas.forEach((m) => {
        ensure(16 + m.comps.length * 7);
        pdf.setTextColor(67, 56, 202); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
        pdf.text(m.name, M, y);
        pdf.text(`${m.sum} / ${m.max}${m.nivel ? '  |  Nivel ' + m.nivel : ''}`, R, y, { align: 'right' });
        y += 3;
        bar(M, y, R - M, m.sum / m.max, 2.6);
        y += 8;
        pdf.setFontSize(9.5);
        m.comps.forEach((s) => {
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 44, 66);
          pdf.text(s.name, M + 3, y);
          bar(M + 90, y - 2.6, 42, s.sum / s.max, 2.2);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${s.sum} / ${s.max}   ${s.etiqueta}`, R, y, { align: 'right' });
          y += 7;
        });
        y += 4;
      });

      if (c.metas.some((m) => m.nivel || m.comps.some((s) => s.nivel))) {
        ensure(14);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(110, 114, 135);
        pdf.text(pdf.splitTextToSize(LEYENDA_NIVELES, W - 2 * M), M, y);
      }

      // ── Interpretación por competencia
      ensure(30);
      y += 4;
      pdf.setTextColor(67, 56, 202); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
      pdf.text('Interpretación por competencia', M, y);
      y += 5;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(110, 114, 135);
      pdf.text(`Rangos de cada competencia (8 reactivos): Bajo ${RANGOS.bajo.min}-${RANGOS.bajo.max}  |  Medio ${RANGOS.medio.min}-${RANGOS.medio.max}  |  Alto ${RANGOS.alto.min}-${RANGOS.alto.max}`, M, y);
      y += 8;
      const COLORS = { bajo: [192, 41, 59], medio: [180, 83, 9], alto: [19, 138, 85] };
      let k = 0;
      c.metas.forEach((m) => {
        ensure(24);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(67, 56, 202);
        pdf.text(m.name.toUpperCase(), M, y);
        pdf.setDrawColor(200, 204, 240); pdf.setLineWidth(0.3); pdf.line(M, y + 1.6, R, y + 1.6);
        y += 7;
        m.comps.forEach((s) => {
          k++;
          const lines = pdf.splitTextToSize(s.texto, W - 2 * M - 6);
          const h = 8 + lines.length * 4.2 + 4;
          ensure(h);
          const col = COLORS[s.rango];
          pdf.setFillColor(col[0], col[1], col[2]); pdf.rect(M, y - 3.5, 1.4, h - 3, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(40, 44, 66);
          pdf.text(`${k}. ${s.name}`, M + 4, y);
          pdf.setTextColor(col[0], col[1], col[2]);
          pdf.text(`${s.etiqueta}  (${s.sum} / ${s.max})`, R, y, { align: 'right' });
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(60, 64, 90);
          pdf.text(lines, M + 4, y + 5);
          y += h;
        });
        y += 2;
      });

      // ── Reactivos y respuestas
      pdf.addPage(); y = 20;
      pdf.setTextColor(67, 56, 202); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
      pdf.text('Reactivos y respuestas', M, y);
      y += 4;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(110, 114, 135);
      pdf.text('Escala: 1 Rara vez o nunca · 2 Pocas veces · 3 Algunas veces · 4 Muchas veces · 5 Muy frecuentemente o siempre', M, y + 3);
      y += 9;
      r.answers.forEach((v, i) => {
        const lines = pdf.splitTextToSize(QUESTIONS[i], 128);
        const h = lines.length * 4 + 3;
        ensure(h);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(67, 56, 202);
        pdf.text(String(i + 1), M, y + 3);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 44, 66);
        pdf.text(lines, M + 10, y + 3);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
        pdf.text(String(v), R - 14, y + 3, { align: 'right' });
        if (NEGATIVOS.has(i + 1)) {
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(130, 134, 155);
          pdf.text(`invertido: ${6 - v}`, R, y + 3, { align: 'right' });
        }
        pdf.setDrawColor(227, 229, 241); pdf.setLineWidth(0.2); pdf.line(M, y + h - 0.8, R, y + h - 0.8);
        y += h;
      });

      // ── Pie de página
      const pages = pdf.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(130, 134, 155);
        pdf.text(`${t.label || 'Sin nombre'}  |  Los reactivos negativos se calificaron de forma invertida`, M, 289);
        pdf.text(`Página ${i} de ${pages}`, R, 289, { align: 'right' });
      }

      pdf.save(`resultado-${fileSafe(t.label)}.pdf`);
      btn.disabled = false; btn.textContent = prev;
    }

    function downloadCsv(t, r, c) {
      const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
      const rows = [
        ['Nombre', t.label || ''],
        ['Fecha', fmtDate(t.completedAt)],
        ['Puntaje total', c.total],
        ['Máximo', c.max],
        [],
        ['Índice de validez', 'Valor', 'Límite', 'Estado'],
        ...Object.keys(IDX_NAMES).map((k) => {
          const v = c.indices[k];
          return [IDX_NAMES[k], v.pendiente ? 'pendiente' : v.valor, v.limite, v.pendiente ? 'pendiente' : v.invalida ? 'INVÁLIDA' : 'aceptable'];
        }),
        [],
        ['Metacompetencia / Competencia', 'Puntaje', 'Máximo', 'Promedio', 'Percentil', 'Nivel', 'Rango', 'Interpretación'],
        ...c.metas.flatMap((m) => [
          [m.name, m.sum, m.max, m.avg.toFixed(2), m.percentil ?? '', m.nivel ?? '', '', ''],
          ...m.comps.map((s) => ['   ' + s.name, s.sum, s.max, s.avg.toFixed(2), s.percentil ?? '', s.nivel ?? '', s.etiqueta, s.texto])
        ]),
        [],
        ['N°', 'Pregunta', 'Respuesta', 'Puntaje aplicado'],
        ...r.answers.map((v, i) => [i + 1, QUESTIONS[i], v, NEGATIVOS.has(i + 1) ? 6 - v : v])
      ].map((row) => row.map(q).join(',')).join('\r\n');
      const blob = new Blob(['﻿' + rows], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `resultado-${fileSafe(t.label)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    // Tiempo real: en cuanto alguien finaliza, aparece aquí solo.
    unsub.push(onSnapshot(query(collection(db, 'tests'), orderBy('createdAt', 'desc')), (snap) => {
      if (!firstLoad) {
        snap.docChanges().forEach((ch) => {
          if (ch.type === 'modified' && ch.doc.data().status === 'completed') {
            toast('✅ ' + (ch.doc.data().label || 'Alguien') + ' terminó el cuestionario');
          }
        });
      }
      firstLoad = false;
      tests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderList();
    }, () => { document.getElementById('list').innerHTML = '<div class="empty">No se pudo leer. Revisa las reglas de Firestore (README, paso 3).</div>'; }));

    unsub.push(onSnapshot(collection(db, 'results'), (snap) => {
      results = {};
      snap.docs.forEach((d) => { results[d.id] = d.data(); });
      renderList();
    }, () => { /* se muestra el error en la lista de arriba */ }));
  }
}
