// Fechas: lee eventos/eventos.json (el mismo archivo que edita el panel /admin) y arma
// la agenda, el ticket de "Próxima fecha" del hero, las fechas pasadas y los datos para Google.
import { t, getLang, onLang } from './i18n.js';
import { ENTORNO, EN_VISOR } from './entorno.js';

const PAISES = {
  AR: { flag: '🇦🇷', es: 'Argentina', en: 'Argentina', tz: /Argentina|Buenos_Aires/ },
  CL: { flag: '🇨🇱', es: 'Chile', en: 'Chile', tz: /Santiago|Punta_Arenas|Easter/ },
  PE: { flag: '🇵🇪', es: 'Perú', en: 'Peru', tz: /Lima/ },
  ES: { flag: '🇪🇸', es: 'España', en: 'Spain', tz: /Madrid|Canary|Ceuta/ },
};
const ORDEN = ['AR', 'CL', 'PE', 'ES'];
const MESES = { ENE: 0, JAN: 0, FEB: 1, MAR: 2, ABR: 3, APR: 3, MAY: 4, JUN: 5, JUL: 6, AGO: 7, AUG: 7, SEP: 8, SEPT: 8, SET: 8, OCT: 9, NOV: 10, DIC: 11, DEC: 11 };
const MES_TXT = {
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
};
const DIA_TXT = { es: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'], en: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] };
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// En Netlify los flyers pasan por su CDN de imágenes (AVIF/WebP al tamaño justo).
// En cualquier otro lado, o si el CDN falla, se usa el archivo original.
const USA_CDN = ENTORNO === 'produccion';
export function flyerSrc(path, w) {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  const clean = '/' + path.replace(/^\.?\/+/, '');
  return USA_CDN ? `/.netlify/images?url=${encodeURIComponent(clean)}&w=${w}&q=74` : path;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function hoy(forzada) {
  // ?hoy=2026-07-01 simula otra fecha (útil para ver cómo queda con fechas próximas)
  const q = forzada || new URLSearchParams(location.search).get('hoy');
  const d = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? new Date(q + 'T00:00:00') : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseFecha(ev, today) {
  const exacta = ev.fechaExacta || ev.fecha_exacta;
  if (exacta) {
    const d = new Date(String(exacta).slice(0, 10) + 'T12:00:00');
    if (!isNaN(d)) return { date: d, exact: true };
  }
  const txt = `${ev.fecha || ''} ${ev.mes || ''}`.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const day = parseInt((txt.match(/\d{1,2}/) || [])[0], 10);
  let mon;
  for (const w of txt.match(/[A-Z]+/g) || []) {
    if (w.slice(0, 4) in MESES) { mon = MESES[w.slice(0, 4)]; break; }
    if (w.slice(0, 3) in MESES) { mon = MESES[w.slice(0, 3)]; break; }
  }
  if (!day || mon === undefined) return { date: null, exact: false };
  // El panel guarda "8 JUL" sin año: se toma la próxima vez que cae esa fecha,
  // salvo que falten más de ~6,5 meses (entonces es una fecha que ya pasó).
  let d = new Date(today.getFullYear(), mon, day, 12);
  if (d < today) d = new Date(today.getFullYear() + 1, mon, day, 12);
  if ((d - today) / 864e5 > 200) d = new Date(d.getFullYear() - 1, mon, day, 12);
  return { date: d, exact: false };
}

function normalizar(raw, i, today) {
  const { date, exact } = parseFecha(raw, today);
  const artistas = (Array.isArray(raw.artistas) ? raw.artistas : []).map((s) => String(s).trim()).filter(Boolean);
  const head = String(raw.headliner || artistas[0] || '').trim();
  return {
    i,
    pais: String(raw.pais || '').toUpperCase(),
    date, exact,
    upcoming: date ? date >= today : true,
    fechaTxt: String(raw.fecha || '').trim(),
    mes: String(raw.mes || '').trim().toUpperCase(),
    localidad: String(raw.localidad || '').trim(),
    sub: String(raw.subtitulo || '').trim(),
    head,
    lineup: artistas.filter((a) => a.toLowerCase() !== head.toLowerCase()),
    img: raw.imagen || '',
    link: String(raw.linkEntradas || '').trim(),
  };
}

function paisVisitante() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return ORDEN.find((p) => PAISES[p].tz.test(tz)) || null;
  } catch (e) { return null; }
}

function dia(ev) { return ev.date ? ev.date.getDate() : (ev.fechaTxt.match(/\d{1,2}/) || [''])[0]; }
function mes(ev, lang) { return ev.date ? MES_TXT[lang][ev.date.getMonth()] : ev.mes; }
function nombrePais(code, lang) { return PAISES[code] ? PAISES[code][lang] : code; }
function pad(n) { return String(n).padStart(2, '0'); }
function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function fallbackImgs(root) {
  root.querySelectorAll('img[data-orig]').forEach((img) => {
    img.addEventListener('error', () => {
      if (img.dataset.fb) return;
      img.dataset.fb = '1';
      img.src = img.dataset.orig;
    }, { once: true });
  });
}

export function initAgenda() {
  const sec = document.getElementById('fechas');
  const els = {
    summary: sec.querySelector('[data-agenda-summary]'),
    filters: sec.querySelector('[data-filters]'),
    paises: sec.querySelector('[data-paises]'),
    meses: sec.querySelector('[data-meses]'),
    lista: sec.querySelector('[data-lista]'),
    vacio: sec.querySelector('[data-vacio]'),
    vacioTitulo: sec.querySelector('[data-vacio-titulo]'),
    pasadas: sec.querySelector('[data-pasadas]'),
    pasadasLista: sec.querySelector('[data-pasadas-lista]'),
    float: sec.querySelector('[data-flyer-float]'),
    next: document.querySelector('[data-next]'),
  };
  const S = { all: [], up: [], past: [], pais: 'ALL', mes: 'ALL' };

  function filtradas() {
    return S.up.filter((e) => (S.pais === 'ALL' || e.pais === S.pais) && (S.mes === 'ALL' || mesKey(e) === S.mes));
  }
  function mesKey(e) { return e.date ? `${e.date.getFullYear()}-${e.date.getMonth()}` : e.mes; }

  function renderFiltros() {
    const lang = getLang();
    const paises = ORDEN.filter((p) => S.up.some((e) => e.pais === p));
    const showPaises = paises.length > 1;
    els.paises.innerHTML = showPaises
      ? [['ALL', t('fechas.todas'), S.up.length], ...paises.map((p) => [p, nombrePais(p, lang), S.up.filter((e) => e.pais === p).length])]
          .map(([code, label, n]) => `<button class="tab" type="button" role="tab" data-pais="${code}" aria-selected="${S.pais === code}">${esc(label)} <small>${n}</small></button>`).join('')
      : '';
    const base = S.up.filter((e) => S.pais === 'ALL' || e.pais === S.pais);
    const meses = [...new Map(base.map((e) => [mesKey(e), mes(e, lang)])).entries()];
    const showMeses = meses.length > 1;
    els.meses.innerHTML = showMeses
      ? [['ALL', t('fechas.todos')], ...meses].map(([k, label]) => `<button class="chip" type="button" data-mes="${esc(k)}" aria-pressed="${S.mes === k}">${esc(label)}</button>`).join('')
      : '';
    els.filters.hidden = !showPaises && !showMeses;
  }

  function filaHTML(ev) {
    const lang = getLang();
    const wd = ev.date && ev.exact ? DIA_TXT[lang][ev.date.getDay()] : '';
    const href = ev.link || '#contacto';
    const ext = ev.link ? ' target="_blank" rel="noopener"' : '';
    const share = EN_VISOR ? 'clipboard' in navigator : 'share' in navigator || 'clipboard' in navigator;
    const agendar = ev.exact && !EN_VISOR;
    return `
      <li class="ev" style="view-transition-name: ev-${ev.i}">
        <a class="ev__link" href="${esc(href)}"${ext} data-flyer="${esc(ev.img)}" data-cursor="${esc(t('cursor.entradas'))}">
          <img class="ev__flyer" src="${esc(flyerSrc(ev.img, 720))}" data-orig="${esc(ev.img)}" alt="${esc(t('fechas.flyer', { h: ev.head }))}" loading="lazy" decoding="async" width="720" height="900">
          <span class="ev__date"><b class="ev__day">${esc(dia(ev))}</b><span class="ev__md"><span class="ev__mon">${esc(mes(ev, lang))}</span>${wd ? `<span class="ev__wd">${wd}</span>` : ''}</span></span>
          <span class="ev__main">${ev.sub ? `<span class="ev__tag">${esc(ev.sub)}</span>` : ''}<span class="ev__head">${esc(ev.head)}</span>${ev.lineup.length ? `<span class="ev__lineup">${ev.lineup.map(esc).join(' · ')}</span>` : ''}</span>
          <span class="ev__place"><span class="ev__city">${esc(ev.localidad || nombrePais(ev.pais, lang))}</span><span class="ev__country">${esc(nombrePais(ev.pais, lang))}</span></span>
          <span class="ev__cta">${esc(ev.link ? t('fechas.entradas') : t('fechas.sinlink'))}<i>${ARROW}</i></span>
        </a>
        <div class="ev__actions">
          ${share ? `<button class="ev__mini" type="button" data-share="${ev.i}">${esc(t('fechas.compartir'))}</button>` : ''}
          ${agendar ? `<button class="ev__mini" type="button" data-ics="${ev.i}">${esc(t('fechas.agendar'))}</button>` : ''}
        </div>
      </li>`;
  }

  function renderLista() {
    const list = filtradas();
    const hayProximas = S.up.length > 0;
    els.lista.innerHTML = list.map(filaHTML).join('');
    els.lista.hidden = !hayProximas;
    fallbackImgs(els.lista);
    els.vacio.hidden = hayProximas;
    if (!hayProximas) els.vacioTitulo.textContent = t('fechas.vacio.t');
    els.summary.textContent = S.up.length === 0 ? t('fechas.resumen.0') : S.up.length === 1 ? t('fechas.resumen.1') : t('fechas.resumen.n', { n: S.up.length });
  }

  function renderPasadas() {
    const lang = getLang();
    const list = S.past.slice(0, 10);
    els.pasadas.hidden = list.length === 0;
    els.pasadasLista.innerHTML = list.map((ev) => `
      <li>
        <img src="${esc(flyerSrc(ev.img, 420))}" data-orig="${esc(ev.img)}" alt="${esc(t('fechas.flyer', { h: ev.head }))}" loading="lazy" decoding="async" width="420" height="525">
        <span class="past__meta"><b>${esc(ev.head)}</b><span>${esc(dia(ev))} ${esc(mes(ev, lang))} · ${esc(ev.localidad || nombrePais(ev.pais, lang))}</span></span>
      </li>`).join('');
    fallbackImgs(els.pasadasLista);
  }

  function renderNext() {
    const lang = getLang();
    const vis = paisVisitante();
    const conFecha = S.up.filter((e) => e.date);
    const ev = conFecha.find((e) => e.pais === vis) || conFecha[0] || S.up[0];
    if (!ev) {
      els.next.innerHTML = `
        <p class="next__label u-util">${esc(t('next.label'))}</p>
        <p class="next__none">${esc(t('next.none'))}</p>
        <p class="next__sub">${esc(t('next.none.sub'))}</p>
        <div class="next__perf"></div>
        <a class="btn btn--line next__btn" href="#contacto">${esc(t('next.none.btn'))}${ARROW}</a>`;
      return;
    }
    els.next.innerHTML = `
      <p class="next__label u-util"><span>${esc(t('next.label'))}</span><span>${esc(nombrePais(ev.pais, lang))}</span></p>
      <div class="next__row">
        <div class="next__date"><b>${esc(dia(ev))}</b><span>${esc(mes(ev, lang))}</span></div>
        <div><strong class="next__head">${esc(ev.head)}</strong><span class="next__place">${esc(ev.localidad || nombrePais(ev.pais, lang))}</span></div>
      </div>
      <div class="next__perf"></div>
      <a class="btn btn--pill next__btn" href="${esc(ev.link || '#fechas')}"${ev.link ? ' target="_blank" rel="noopener"' : ''} data-cursor="${esc(t('cursor.entradas'))}">${esc(t('next.btn'))}${ARROW}</a>`;
  }

  function jsonLd() {
    const base = ENTORNO === 'produccion' ? location.origin : 'https://rioelectronicmusic.com';
    const events = S.up.filter((e) => e.date).map((e) => ({
      '@type': 'MusicEvent',
      name: `${e.head} · Río Electronic Music`,
      startDate: iso(e.date),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: e.localidad || nombrePais(e.pais, 'es'), address: { '@type': 'PostalAddress', addressLocality: e.localidad || undefined, addressCountry: e.pais || undefined } },
      image: e.img ? [`${base}/${e.img.replace(/^\.?\/+/, '')}`] : undefined,
      performer: [e.head, ...e.lineup].map((name) => ({ '@type': 'MusicGroup', name })),
      organizer: { '@type': 'Organization', name: 'Río Electronic Music', url: 'https://rioelectronicmusic.com/' },
      offers: e.link ? { '@type': 'Offer', url: e.link, availability: 'https://schema.org/InStock' } : undefined,
    }));
    let tag = document.getElementById('ld-eventos');
    if (!events.length) { tag?.remove(); return; }
    if (!tag) {
      tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.id = 'ld-eventos';
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': events });
  }

  function renderTodo(animar) {
    const go = () => { renderFiltros(); renderLista(); };
    if (animar && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const vt = document.startViewTransition(go);
      vt.ready.catch(() => {});
      vt.finished.catch(() => {});
    } else go();
  }

  // --- interacción ---
  els.paises.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pais]');
    if (!b || b.dataset.pais === S.pais) return;
    S.pais = b.dataset.pais;
    S.mes = 'ALL';
    renderTodo(true);
  });
  els.meses.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mes]');
    if (!b || b.dataset.mes === S.mes) return;
    S.mes = b.dataset.mes;
    renderTodo(true);
  });
  els.lista.addEventListener('click', async (e) => {
    const sh = e.target.closest('[data-share]');
    const ic = e.target.closest('[data-ics]');
    if (sh) {
      const ev = S.all[+sh.dataset.share];
      const url = ev.link || `${location.origin}${location.pathname}#fechas`;
      const text = `${ev.head} · ${dia(ev)} ${mes(ev, getLang())} · ${ev.localidad}`;
      try {
        if (navigator.share && !EN_VISOR) await navigator.share({ title: `${ev.head} · Río Electronic Music`, text, url });
        else { await navigator.clipboard.writeText(`${text} ${url}`); sh.textContent = t('fechas.copiado'); setTimeout(() => { sh.textContent = t('fechas.compartir'); }, 1800); }
      } catch (err) { /* compartir cancelado o no permitido */ }
    }
    if (ic) {
      const ev = S.all[+ic.dataset.ics];
      const d = ev.date;
      const d2 = new Date(d); d2.setDate(d.getDate() + 1);
      const ymd = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}`;
      const icsTxt = (s) => String(s).replace(/([,;\\])/g, '\\$1');
      const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      const body = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rio Electronic Music//Agenda//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
        `UID:rio-${ymd(d)}-${ev.i}@rioelectronicmusic.com`, `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(d2)}`,
        `SUMMARY:${icsTxt(ev.head)} · Río Electronic Music`,
        ev.localidad ? `LOCATION:${icsTxt(ev.localidad)}` : '',
        ev.link ? `URL:${ev.link}` : '',
        'END:VEVENT', 'END:VCALENDAR',
      ].filter(Boolean).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
      a.download = `rio-${ymd(d)}.ics`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  });

  // flyer que sigue al cursor (solo escritorio con mouse)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && window.gsap) {
    const gsap = window.gsap;
    const img = els.float.querySelector('img');
    const xTo = gsap.quickTo(els.float, 'x', { duration: 0.55, ease: 'power3' });
    const yTo = gsap.quickTo(els.float, 'y', { duration: 0.55, ease: 'power3' });
    let lastX = 0;
    els.lista.addEventListener('pointermove', (e) => {
      const w = els.float.offsetWidth, h = els.float.offsetHeight;
      const right = e.clientX + 36 + w < window.innerWidth;
      xTo(right ? e.clientX + 36 : e.clientX - 36 - w);
      yTo(Math.min(window.innerHeight - h - 12, Math.max(12, e.clientY - h / 2)));
      const vx = e.clientX - lastX;
      lastX = e.clientX;
      gsap.to(els.float, { rotate: Math.max(-10, Math.min(10, vx * 0.5)), duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    });
    els.lista.addEventListener('pointerover', (e) => {
      const a = e.target.closest('.ev__link');
      if (!a || !a.dataset.flyer) return;
      if (img.dataset.cur !== a.dataset.flyer) {
        img.dataset.cur = a.dataset.flyer;
        img.dataset.fb = '';
        img.onerror = () => { if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = a.dataset.flyer; } };
        img.src = flyerSrc(a.dataset.flyer, 600);
      }
      gsap.to(els.float, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    });
    els.lista.addEventListener('pointerleave', () => gsap.to(els.float, { opacity: 0, scale: 0.7, duration: 0.4, ease: 'power2.in', overwrite: 'auto' }));
    // cuando la agenda se acerca a la pantalla, se precargan los flyers para que el hover sea instantáneo
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      S.up.forEach((ev) => { if (ev.img) { const i = new Image(); i.decoding = 'async'; i.src = flyerSrc(ev.img, 600); } });
    }, { rootMargin: '600px 0px' }).observe(els.lista);
  }

  const renderAll = () => { renderFiltros(); renderLista(); renderPasadas(); renderNext(); };
  onLang(renderAll);

  // --- carga ---
  let raws = [];
  function procesar(fechaForzada) {
    const today = hoy(fechaForzada);
    S.all = raws.map((raw, i) => normalizar(raw, i, today));
    const byDate = (a, b) => (a.date ? a.date.getTime() : Infinity) - (b.date ? b.date.getTime() : Infinity);
    S.up = S.all.filter((e) => e.upcoming).sort(byDate);
    S.past = S.all.filter((e) => !e.upcoming).sort((a, b) => byDate(b, a));
    const vis = paisVisitante();
    const paises = new Set(S.up.map((e) => e.pais));
    S.pais = vis && paises.has(vis) && paises.size > 1 ? vis : 'ALL';
    S.mes = 'ALL';
  }
  simular = (iso) => { procesar(iso); renderAll(); };

  return fetch('eventos/eventos.json', { cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => { raws = data.eventos || []; procesar(); })
    .catch((err) => { console.warn('[Río] No se pudieron cargar las fechas:', err); })
    .finally(() => { renderAll(); jsonLd(); });
}

// Para la vista previa: recalcula la agenda como si hoy fuera otra fecha (null = hoy de verdad).
let simular = () => {};
export function simularHoy(iso) { simular(iso); }
