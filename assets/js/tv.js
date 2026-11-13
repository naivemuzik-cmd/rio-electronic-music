// Río TV: sets completos del canal de YouTube. El video se carga recién al dar play
// (youtube-nocookie) y, si seguís bajando, el reproductor se acomoda en una esquina.
import { t, getLang, onLang } from './i18n.js';
import { EN_VISOR } from './entorno.js';

// En el visor de Claude no se pueden embeber videos: el play abre el set en YouTube.
const EMBED = !EN_VISOR;

// Datos tomados del canal @rioelectronicmusictv (vistas a nov-2026, redondeadas hacia abajo).
export const SETS = [
  { id: 'XgrskVWsxFQ', dj: 'Popof', place: 'Buenos Aires', year: 2025, views: 93875 },
  { id: '9m2a5u7xQN0', dj: 'Jay de Lys', place: 'La Plata', year: 2024, views: 171780 },
  { id: 'UzYC3f3DSD8', dj: 'Nicolas Taboada', place: 'Buenos Aires', year: 2024, views: 97627 },
  { id: 'U-HaTPEfTvo', dj: 'Kolombo', place: 'Buenos Aires', year: 2024, views: 93442 },
  { id: '8nJpYGUrnmI', dj: 'Moritz Hofbauer', place: 'Buenos Aires', year: 2024, views: 57767 },
  { id: 'qDSJb0eLYys', dj: 'Miguel Bastida', place: 'Buenos Aires', year: 2024, views: 57080 },
  { id: '7KN8WxkDx3c', dj: 'De La Swing', place: 'Buenos Aires', year: 2024, views: 51088 },
  { id: 'AVsKt1g4olA', dj: 'Lexlay', place: 'Buenos Aires', year: 2024, views: 24267 },
  { id: 'kxIleHzfDQc', dj: 'Muter b2b Key City', place: 'Río Boat Party · Buenos Aires', year: null, views: 8411 },
  { id: '0IiUd5LvSP0', dj: 'Tomas Otero', place: 'Buenos Aires', year: 2025, views: 6070 },
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const thumb = (id, w) => `assets/img/tv/${id}-${w}.webp`;

function vistas(n) {
  const k = Math.floor(n / 1000);
  return getLang() === 'en' ? `${k}K+ ${t('tv.vistas')}` : `+${k} mil ${t('tv.vistas')}`;
}

export function initTV({ lenis }) {
  const list = document.querySelector('[data-tv-list]');
  const stage = document.querySelector('[data-stage]');
  const player = stage.querySelector('[data-player]');
  const poster = player.querySelector('[data-poster]');
  let play = player.querySelector('[data-play]');
  if (!EMBED) {
    const a = document.createElement('a');
    a.className = play.className;
    a.innerHTML = play.innerHTML;
    a.target = '_blank';
    a.rel = 'noopener';
    a.dataset.play = '';
    a.dataset.cursor = play.dataset.cursor;
    play.replaceWith(a);
    play = a;
  }
  const nowDj = player.querySelector('[data-now-dj]');
  const nowPlace = player.querySelector('[data-now-place]');
  let cur = 0;
  let playing = false;

  function lugar(s) { return [s.place, s.year].filter(Boolean).join(' · '); }

  function renderList() {
    list.innerHTML = SETS.map((s, i) => `
      <li class="tv__item">
        <button type="button" data-set="${i}" aria-current="${i === cur}">
          <img src="${thumb(s.id, 640)}" alt="" loading="lazy" decoding="async" width="640" height="360">
          <span class="tv__txt"><b>${esc(s.dj)}</b><small>${esc(lugar(s))} · ${esc(vistas(s.views))}</small></span>
        </button>
      </li>`).join('');
  }

  function setCurrent(i) {
    cur = i;
    const s = SETS[i];
    poster.src = thumb(s.id, 1280);
    poster.srcset = `${thumb(s.id, 640)} 640w, ${thumb(s.id, 1280)} 1280w`;
    poster.sizes = '(max-width: 1100px) 100vw, 60vw';
    nowDj.textContent = s.dj;
    nowPlace.textContent = lugar(s);
    play.setAttribute('aria-label', t(EMBED ? 'tv.play' : 'tv.verEnYoutube', { dj: s.dj }));
    if (!EMBED) play.href = `https://www.youtube.com/watch?v=${s.id}`;
    list.querySelectorAll('[data-set]').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.set === i)));
  }

  function parar() {
    player.querySelector('iframe')?.remove();
    player.classList.remove('is-playing', 'is-docked');
    playing = false;
  }

  function reproducir() {
    parar();
    const s = SETS[cur];
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${s.id}?autoplay=1&rel=0&playsinline=1`;
    f.title = `${s.dj} @ Río Electronic Music`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    player.appendChild(f);
    player.classList.add('is-playing');
    playing = true;
  }

  if (EMBED) play.addEventListener('click', reproducir);
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set]');
    if (!b) return;
    const i = +b.dataset.set;
    const swap = () => setCurrent(i);
    if (document.startViewTransition && !playing) {
      const vt = document.startViewTransition(swap);
      vt.ready.catch(() => {});
      vt.finished.catch(() => {});
    } else swap();
    if (playing) reproducir();
    else if (matchMedia('(max-width: 1100px)').matches) {
      lenis ? lenis.scrollTo(stage, { offset: -90 }) : stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // el set te acompaña: si bajás, el reproductor se achica a una esquina
  new IntersectionObserver(([e]) => {
    if (!playing) return;
    player.classList.toggle('is-docked', !e.isIntersecting);
  }, { threshold: 0.2 }).observe(stage);
  player.querySelector('[data-undock]').addEventListener('click', () => {
    lenis ? lenis.scrollTo('#tv', { offset: -40 }) : document.getElementById('tv').scrollIntoView({ behavior: 'smooth' });
  });
  player.querySelector('[data-close]').addEventListener('click', parar);

  renderList();
  setCurrent(0);
  onLang(() => { renderList(); setCurrent(cur); });
}
