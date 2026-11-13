// Río Electronic Music — orquestación general.
import { applyI18n, setLang, getLang, onLang, t } from './i18n.js';
import { initHero } from './hero-water.js';
import { initAgenda, simularHoy } from './agenda.js';
import { initGallery } from './gallery.js';
import { initTV } from './tv.js';
import { ENTORNO } from './entorno.js';

const ARTISTAS = [
  'Solomun', 'Tale Of Us', 'Michael Bibi', 'Boris Brejcha', 'Adriatique', 'Adam Beyer', 'John Summit', 'James Hype',
  'ANOTR', 'Mochakk', 'Mau P', 'Pawsa', 'Jamie Jones', 'John Digweed', 'Sasha', 'Fisher', 'Loco Dice', 'Claptone',
  'Guy J', 'Franky Rizardo', 'Nick Warren', 'Sven Väth', 'Luciano', 'Wade', 'Cloonee', 'Max Styler', 'Popof',
  'Dennis Cruz', 'Ilario Alicante', 'Chris Stussy', 'Paco Osuna', 'Dubfire', 'Kolombo',
];

const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const { gsap, ScrollTrigger, SplitText, Lenis } = window;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

gsap.registerPlugin(ScrollTrigger, SplitText);
applyI18n();
fillPills();
$('[data-year]').textContent = new Date().getFullYear();

// ---------- scroll suave ----------
let lenis = null;
if (!reduce && Lenis) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// links internos
const menu = $('#menu');
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id.length > 1 && document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  if (menu.matches(':popover-open')) menu.hidePopover();
  if (lenis) lenis.scrollTo(target, { offset: id === '#inicio' ? 0 : -60, duration: 1.5 });
  else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  if (id !== '#inicio') {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  history.replaceState(null, '', id === '#inicio' ? location.pathname + location.search : id);
});
menu.addEventListener('toggle', (e) => (e.newState === 'open' ? lenis?.stop() : lenis?.start()));

// ---------- módulos ----------
const heroEl = $('[data-hero]');
const hero = initHero({ canvas: $('[data-gl]'), hero: heroEl, reduce });
const agendaReady = initAgenda();
initGallery({ reduce, lenis });
initTV({ lenis });
buildArtistas();

// ---------- loader: la línea de carga se vuelve el horizonte ----------
const count = $('[data-count]');
const line = $('[data-line]');
const prog = { v: 0 };
let target = 0.08;
function paint() {
  count.textContent = String(Math.round(prog.v * 100)).padStart(3, '0');
  line.style.setProperty('--p', prog.v.toFixed(3));
}
function bump(share) {
  target = Math.min(1, target + share);
  gsap.to(prog, { v: target, duration: 0.6, ease: 'power2.out', onUpdate: paint, overwrite: true });
}
const tareas = [document.fonts ? document.fonts.ready : Promise.resolve(), hero.ready, agendaReady];
tareas.forEach((p) => Promise.resolve(p).catch(() => {}).then(() => bump(0.92 / tareas.length)));
let terminado = false;
function terminar() {
  if (terminado) return;
  terminado = true;
  prog.v = 1;
  paint();
  html.classList.add('is-loaded');
  hero.intro();
  heroIn();
  ScrollTrigger.refresh();
}
Promise.race([
  Promise.allSettled(tareas),
  new Promise((r) => setTimeout(r, 5000)),
]).then(() => {
  gsap.to(prog, { v: 1, duration: reduce ? 0.01 : 0.55, ease: 'power2.inOut', onUpdate: paint, onComplete: terminar });
});
// red de seguridad: aunque algo se trabe, a los 6,5 s la página arranca igual
setTimeout(terminar, 6500);

// ---------- entrada del hero ----------
let claimSplit = null;
function heroIn() {
  if (reduce) return;
  claimSplit = SplitText.create('.hero__claim', { type: 'lines', mask: 'lines', linesClass: 'line' });
  const tl = gsap.timeline({ delay: 0.75 });
  tl.from('.nav > *:not(.nav__progress)', { y: -30, opacity: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0)
    .from('.hero__kicker', { y: 16, opacity: 0, duration: 1, ease: 'power3.out' }, 0.15)
    .from(claimSplit.lines, { yPercent: 110, duration: 1.4, stagger: 0.09, ease: 'expo.out' }, 0.2)
    .from('.hero__countries', { opacity: 0, duration: 1.2 }, 0.7)
    .from('.next', { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out' }, 0.55);
}

// el hero se hunde en el río al bajar
ScrollTrigger.create({
  trigger: heroEl, start: 'top top', end: 'bottom top',
  onUpdate: (self) => hero.setScroll(self.progress),
});
if (!reduce) {
  gsap.to('.hero__inner', {
    yPercent: -18, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: heroEl, start: 'top top', end: '60% top', scrub: true },
  });
}

// ---------- nav: se esconde al bajar, vuelve al subir ----------
const nav = $('[data-nav]');
let lastY = 0;
function onScroll(y) {
  const h = heroEl.offsetHeight;
  nav.classList.toggle('is-solid', y > h * 0.8);
  if (y > h * 0.5 && y > lastY + 6) nav.classList.add('is-hidden');
  else if (y < lastY - 6 || y < h * 0.5) nav.classList.remove('is-hidden');
  lastY = y;
}
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

// el logo gira como un disco; más rápido cuando scrolleás
const logo = $('[data-spin]');
if (!reduce) {
  let rot = 0;
  gsap.ticker.add((time, dt) => {
    const v = lenis ? Math.abs(lenis.velocity) : 0;
    rot = (rot + (dt / 1000) * (12 + Math.min(v, 60) * 9)) % 360;
    logo.style.rotate = `${rot.toFixed(2)}deg`;
  });
}

// ---------- títulos y textos que se revelan ----------
let splits = [];
function revealTitles() {
  splits.forEach((s) => s.revert());
  splits = [];
  if (reduce) return;
  $$('[data-reveal]').forEach((el) => {
    if (el.dataset.done) return;
    const s = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    splits.push(s);
    gsap.from(s.lines, {
      yPercent: 110, duration: 1.3, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true, onEnter: () => { el.dataset.done = '1'; } },
    });
  });
}

let words = null;
let wordsTween = null;
function manifiesto() {
  wordsTween?.scrollTrigger?.kill();
  wordsTween?.kill();
  words?.revert();
  if (reduce) return;
  const el = $('[data-words]');
  words = SplitText.create(el, { type: 'words', wordsClass: 'w' });
  wordsTween = gsap.to(words.words, {
    opacity: 1, stagger: 0.12, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.6 },
  });
  gsap.from(el.querySelectorAll('.pill'), {
    scale: 0, duration: 0.9, ease: 'back.out(2)', stagger: 0.15,
    scrollTrigger: { trigger: el, start: 'top 70%', once: true },
  });
}

function fades() {
  if (reduce) return;
  const sel = '.eyebrow:not(.galeria__head .eyebrow), .tv__aside, .sello__copy p, .sello__links li, .redes li, .nos__copy > *, .artistas__intro, .contacto__p, .news, .agenda__past, .agenda__empty, .tv__item, .pie__cols nav';
  gsap.set(sel, { y: 30, opacity: 0 });
  ScrollTrigger.batch(sel, {
    start: 'top 92%', once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07, overwrite: true }),
  });
  // si la página se recarga a mitad de camino, lo que ya quedó arriba se muestra sin esperar
  requestAnimationFrame(() => gsap.utils.toArray(sel).forEach((el) => {
    if (el.getBoundingClientRect().bottom < 0) gsap.set(el, { y: 0, opacity: 1 });
  }));
  // parallax suave en fotos
  gsap.fromTo('.nos__foto img', { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.nos__foto', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.contacto__bg', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.contacto', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.tv__stage', { clipPath: 'inset(12% 8% 12% 8% round 14px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.tv__stage', start: 'top 85%', once: true }, clearProps: 'clipPath' });
  gsap.from('.nos__foto', { clipPath: 'inset(100% 0 0 0 round 18px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.nos__foto', start: 'top 85%', once: true }, clearProps: 'clipPath' });
}

// las filas de artistas que se deslizan
function buildArtistas() {
  $('[data-artistas-lista]').innerHTML = ARTISTAS.map((a) => `<li>${esc(a)}</li>`).join('');
  const rows = $('[data-rows]');
  const n = 4;
  const filas = Array.from({ length: n }, () => []);
  ARTISTAS.forEach((a, i) => filas[i % n].push(a));
  rows.innerHTML = filas.map((f) => `<div class="fila">${[...f, ...f].map((a) => `<span>${esc(a)}</span><i>●</i>`).join('')}</div>`).join('');
  if (reduce) return;
  $$('.fila', rows).forEach((row, i) => {
    const der = i % 2 === 1;
    gsap.fromTo(row, { xPercent: der ? -30 : -5 }, {
      xPercent: der ? -5 : -30, ease: 'none',
      scrollTrigger: { trigger: rows, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    });
  });
}

// ---------- cursor ----------
const cursor = $('[data-cursor-el]');
if (fine && !reduce) {
  html.classList.add('has-cursor');
  const label = $('[data-cursor-label]');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); cursor.classList.remove('is-hidden'); }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-cursor], a, button, input, [role="tab"]');
    const txt = el?.dataset?.cursor || '';
    cursor.classList.toggle('is-label', !!txt);
    cursor.classList.toggle('is-link', !!el && !txt);
    label.textContent = txt;
  });
  // botones magnéticos
  $$('.btn--pill, .tv__play, .lang, .nav__menu').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.25);
      my((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
}

// ---------- idioma ----------
$$('[data-lang]').forEach((b) => b.addEventListener('click', () => {
  const next = b.dataset.lang;
  if (next === getLang()) return;
  splits.forEach((s) => s.revert());
  claimSplit?.revert();
  claimSplit = null;
  words?.revert();
  setLang(next);
}));
onLang(() => {
  fillPills();
  revealTitles();
  manifiesto();
  $$('[data-cursor]').forEach((el) => {
    if (el.matches('.tv__play')) el.dataset.cursor = t('cursor.play');
  });
  requestAnimationFrame(() => ScrollTrigger.refresh());
});

function fillPills() {
  $$('[data-pill]').forEach((p) => {
    const id = p.dataset.pill;
    p.style.backgroundImage = `url("assets/img/fotos/pill-${id}.webp")`;
    p.style.backgroundImage = `image-set(url("assets/img/fotos/pill-${id}.avif") type("image/avif"), url("assets/img/fotos/pill-${id}.webp") type("image/webp"))`;
  });
}

// ---------- newsletter (Netlify Forms) ----------
const form = $('[data-news]');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('[data-news-msg]', form);
  const input = form.elements.email;
  const btn = form.querySelector('button[type="submit"]');
  if (!input.value.trim() || !input.checkValidity()) {
    msg.className = 'news__msg is-error';
    msg.textContent = t('news.invalido');
    input.focus();
    return;
  }
  msg.className = 'news__msg';
  msg.textContent = t('news.enviando');
  btn.disabled = true;
  try {
    if (ENTORNO === 'vista') {
      // Link de vista previa: no hay dónde guardar el email, y se dice tal cual.
      msg.className = 'news__msg is-ok';
      msg.textContent = t('news.vista');
      return;
    }
    if (ENTORNO === 'local') {
      // En local no hay Netlify: se simula el guardado. Publicado, el email queda en Netlify → Forms.
      await new Promise((r) => setTimeout(r, 700));
      console.info('[Río] Modo local: el email no se envió a ningún lado.');
    } else {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error(String(res.status));
    }
    form.classList.add('is-done');
    msg.className = 'news__msg is-ok';
    msg.textContent = t('news.ok');
  } catch (err) {
    msg.className = 'news__msg is-error';
    msg.textContent = t('news.error');
  } finally {
    btn.disabled = false;
  }
});

// ---------- vista previa: se marca como propuesta y permite simular fechas próximas ----------
if (ENTORNO === 'vista') {
  const badge = document.createElement('aside');
  badge.className = 'vista';
  badge.innerHTML = `<span class="vista__txt" data-i18n="vista.badge">${esc(t('vista.badge'))}</span>
    <button class="vista__btn" type="button" data-simular aria-pressed="false" data-i18n="vista.simular">${esc(t('vista.simular'))}</button>`;
  document.body.appendChild(badge);
  const btn = badge.querySelector('[data-simular]');
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    btn.dataset.i18n = on ? 'vista.real' : 'vista.simular';
    btn.textContent = t(btn.dataset.i18n);
    simularHoy(on ? '2026-07-01' : null);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    if (lenis) lenis.scrollTo('#fechas', { offset: -60, duration: 1.4 });
    else document.getElementById('fechas').scrollIntoView({ behavior: 'smooth' });
  });
}

// ---------- arranque de animaciones de scroll ----------
Promise.resolve(agendaReady).finally(() => {
  revealTitles();
  manifiesto();
  fades();
  ScrollTrigger.refresh();
});
document.fonts?.ready.then(() => ScrollTrigger.refresh());
