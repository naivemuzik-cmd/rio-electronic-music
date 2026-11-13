// Galería "De la noche al amanecer": las fotos van en el orden en que se sacaron
// (según la hora de la cámara) y el fondo toma el color de cada una.
import { FOTOS } from './data-fotos.js';
import { t, getLang, onLang } from './i18n.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const src = (stem, ext) => `assets/img/fotos/${stem}.${ext}`;
const srcset = (it, ext) => it.v.map((v) => `${src(v.stem, ext)} ${v.w}w`).join(', ');
const hora = (min) => `+${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export function initGallery({ reduce, lenis }) {
  const sec = document.querySelector('[data-galeria]');
  const list = sec.querySelector('[data-gal-list]');
  const track = sec.querySelector('[data-gal-track]');
  const pin = sec.querySelector('[data-gal-pin]');
  const bar = sec.querySelector('[data-gal-bar]');
  const items = FOTOS.gallery;
  const noche = getComputedStyle(document.documentElement).getPropertyValue('--noche').trim() || '#06110e';
  const sizes = '(max-width: 760px) 78vw, 52vh';

  list.innerHTML = items.map((it, i) => {
    const small = it.v[it.v.length - 1];
    return `
      <li class="gfoto" style="--ar: ${it.w} / ${it.h}; --lqip: url('${it.lqip}')">
        <button class="gfoto__btn" type="button" data-i="${i}">
          <picture>
            <source type="image/avif" srcset="${srcset(it, 'avif')}" sizes="${sizes}">
            <img src="${src(small.stem, 'webp')}" srcset="${srcset(it, 'webp')}" sizes="${sizes}" alt="" width="${it.w}" height="${it.h}" loading="lazy" decoding="async">
          </picture>
        </button>
        <span class="gfoto__time">${hora(it.min)}</span>
      </li>`;
  }).join('');

  function textos() {
    const lang = getLang();
    list.querySelectorAll('[data-i]').forEach((b) => {
      const it = items[+b.dataset.i];
      const alt = it.alt[lang] || it.alt.es;
      b.querySelector('img').alt = alt;
      b.setAttribute('aria-label', t('gal.ver', { alt }));
      b.dataset.cursor = t('cursor.ver');
      b.nextElementSibling.title = t('gal.tiempo', { t: hora(it.min) });
    });
  }
  textos();
  onLang(textos);

  // ---------- scroll horizontal (escritorio) / swipe (celular) ----------
  const { gsap, ScrollTrigger } = window;
  const colores = [noche, ...items.map((i) => i.color), noche];
  if (gsap && ScrollTrigger) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
      const color = gsap.utils.interpolate(colores);
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none' });
      ScrollTrigger.create({
        trigger: sec,
        pin,
        start: 'top top',
        end: () => '+=' + dist(),
        scrub: 0.7,
        animation: tween,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate(self) {
          sec.style.setProperty('--gbg', color(self.progress));
          bar.style.setProperty('--gp', self.progress.toFixed(4));
        },
      });
      list.querySelectorAll('.gfoto').forEach((fig) => {
        gsap.fromTo(fig.querySelector('img'), { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: fig, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });
      // el título entra apenas la sección toca la pantalla
      gsap.from(sec.querySelectorAll('.galeria__head > *'), {
        y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: sec, start: 'top 70%' },
      });
    });
    mm.add('(max-width: 760px), (prefers-reduced-motion: reduce)', () => {
      sec.style.setProperty('--gbg', items[0].color);
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = +e.target.querySelector('[data-i]').dataset.i;
          sec.style.setProperty('--gbg', items[i].color);
          bar.style.setProperty('--gp', (i / (items.length - 1)).toFixed(4));
        });
      }, { root: list, threshold: 0.6 });
      list.querySelectorAll('.gfoto').forEach((f) => io.observe(f));
      return () => io.disconnect();
    });
  }

  // ---------- lightbox con View Transitions ----------
  const dlg = document.querySelector('[data-lightbox]');
  const img = dlg.querySelector('[data-lb-img]');
  const cap = dlg.querySelector('[data-lb-cap]');
  const count = dlg.querySelector('[data-lb-count]');
  let cur = 0;

  function mostrar(i, previewSrc) {
    cur = (i + items.length) % items.length;
    const it = items[cur];
    const big = src(it.v[0].stem, 'webp');
    const alt = it.alt[getLang()] || it.alt.es;
    img.alt = alt;
    cap.textContent = `${hora(it.min)} · ${alt}`;
    count.textContent = `${cur + 1} / ${items.length}`;
    if (previewSrc) {
      img.src = previewSrc;
      const hi = new Image();
      hi.onload = () => { if (cur === i) img.src = big; };
      hi.src = big;
    } else img.src = big;
  }

  function abrir(i, from) {
    const thumb = from?.querySelector('img');
    const preview = thumb?.currentSrc || '';
    const open = () => {
      mostrar(i, preview);
      if (!dlg.open) dlg.showModal();
      lenis?.stop();
    };
    if (document.startViewTransition && !reduce && thumb) {
      thumb.style.viewTransitionName = 'foto';
      const vt = document.startViewTransition(async () => {
        thumb.style.viewTransitionName = '';
        img.style.viewTransitionName = 'foto';
        open();
        try { await img.decode(); } catch (e) { /* sigue igual */ }
      });
      vt.ready.catch(() => {});
      vt.finished.catch(() => {}).then(() => { img.style.viewTransitionName = ''; });
    } else open();
  }

  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) abrir(+b.dataset.i, b);
  });
  dlg.querySelector('[data-lb-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('[data-lb-prev]').addEventListener('click', () => mostrar(cur - 1));
  dlg.querySelector('[data-lb-next]').addEventListener('click', () => mostrar(cur + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrar(cur - 1);
    if (e.key === 'ArrowRight') mostrar(cur + 1);
  });
  dlg.addEventListener('close', () => lenis?.start());

  // swipe en el lightbox
  let sx = null;
  dlg.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  dlg.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) mostrar(cur + (dx < 0 ? 1 : -1));
  });
}
