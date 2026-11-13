// Textos del sitio en español (rioplatense) e inglés.
// data-i18n="clave" → textContent · data-i18n-html → innerHTML (solo textos propios, nunca datos externos)
// data-i18n-aria → aria-label · data-i18n-placeholder → placeholder · data-i18n-alt → alt

const PILL = (id) => `<span class="pill" data-pill="${id}"></span>`;

export const DICT = {
  es: {
    'skip': 'Saltar a las fechas',
    'nav.principal': 'Principal',
    'nav.menu': 'Menú',
    'nav.fechas': 'Fechas',
    'nav.nosotros': 'Nosotros',
    'nav.galeria': 'Galería',
    'nav.artistas': 'Artistas',
    'nav.sello': 'Sello',
    'nav.contacto': 'Contacto',
    'nav.entradas': 'Entradas',
    'nav.abrir': 'Abrir menú',
    'nav.cerrar': 'Cerrar',

    'hero.kicker': 'Desde Punta Carrasco, Buenos Aires',
    'hero.claim': 'La fiesta de electrónica <em>más icónica</em>',
    'hero.paises': 'Argentina · Chile · Perú · España',
    'hero.bajar': 'Bajá',

    'next.label': 'Próxima fecha',
    'next.btn': 'Comprar entradas',
    'next.none': 'Fechas nuevas muy pronto',
    'next.none.sub': 'Suscribite y te avisamos apenas salgan.',
    'next.none.btn': 'Avisame',

    'fechas.eyebrow': 'Agenda',
    'fechas.title': 'Fechas',
    'fechas.pais': 'Filtrar por país',
    'fechas.todas': 'Todas',
    'fechas.todos': 'Todos',
    'fechas.resumen.1': '1 fecha próxima',
    'fechas.resumen.n': '{n} fechas próximas',
    'fechas.resumen.0': 'Agenda',
    'fechas.entradas': 'Entradas',
    'fechas.sinlink': 'Entradas pronto',
    'fechas.compartir': 'Compartir',
    'fechas.agendar': 'Agendar',
    'fechas.copiado': 'Link copiado',
    'fechas.vacio.t': 'Por ahora no hay fechas anunciadas',
    'fechas.vacio.pais': 'Por ahora no hay fechas en {pais}',
    'fechas.vacio.p': 'Las fechas nuevas salen primero en el newsletter y en Instagram.',
    'fechas.vacio.cta': 'Quiero enterarme primero',
    'fechas.pasadas': 'Ya pasaron por Río',
    'fechas.flyer': 'Flyer de {h}',

    'nos.eyebrow': 'Sobre Río',
    'nos.manifiesto': `Río nació en Buenos Aires, <em>a orillas del río</em> ${PILL('dsc01112')}. En Punta Carrasco juntamos naturaleza ${PILL('dsc01966')}, el río y la mejor música del mundo ${PILL('dsc00033')}: lo veraniego y lo subterráneo, lo internacional y lo local. Hoy la fiesta viaja por Argentina, Chile, Perú y España ${PILL('dsc02040')}.`,
    'nos.voz': 'Lo veraniego y lo subterráneo.',
    'nos.p2': 'Desde sus inicios en Punta Carrasco, Río recibe a los mejores DJs internacionales en locaciones únicas. Una experiencia que mezcla lo internacional con lo local, y que hoy también se arma en Chile, Perú y España.',
    'nos.verartistas': 'Ver artistas destacados',
    'nos.fotoalt': 'Dos DJs saludan al público desde la cabina de Río, junto a un flamenco',

    'gal.eyebrow': 'Galería',
    'gal.t1': 'De la noche',
    'gal.t2': 'al amanecer',
    'gal.intro': 'Doce fotos de una misma fiesta, en el orden en que se sacaron.',
    'gal.noche': 'Noche',
    'gal.amanecer': 'Amanecer',
    'gal.ver': 'Ver foto: {alt}',
    'gal.tiempo': '{t} desde la primera foto',

    'tv.eyebrow': 'Sets completos',
    'tv.intro': 'Grabados en nuestras fiestas, de principio a fin. Dale play y seguí navegando: el set te acompaña.',
    'tv.canal': 'Ver el canal',
    'tv.vistas': 'vistas',
    'tv.play': 'Reproducir el set de {dj}',
    'tv.cerrar': 'Cerrar reproductor',
    'tv.volver': 'Volver a Río TV',
    'tv.verEnYoutube': 'Ver el set de {dj} en YouTube',

    'vista.badge': 'Propuesta de rediseño · vista previa',
    'vista.simular': 'Simular fechas próximas',
    'vista.real': 'Ver fechas reales',
    'news.vista': 'Vista previa: en el sitio publicado, acá se guarda tu email.',

    'art.eyebrow': 'Line-ups',
    'art.title': 'Artistas destacados',
    'art.intro': 'Los mejores DJs internacionales, en locaciones únicas.',

    'sello.eyebrow': 'Sello',
    'sello.p': 'El sello discográfico de Río: lanzamientos originales, remixes y compilados de los artistas que pasan por nuestras fiestas.',
    'sello.beatport': 'El catálogo completo del sello',
    'sello.plataformas': 'Todas las plataformas',
    'sello.ingrv': 'Spotify, Apple Music, Tidal, Deezer y más, en un solo link (Ingrv)',
    'sello.ig': 'Instagram del sello',
    'sello.igdesc': 'Adelantos de lanzamientos, detrás de escena y novedades',

    'news.eyebrow': 'Newsletter',
    'news.title': 'No te pierdas <em class="voz">nada</em>',
    'news.p': 'Suscribite y te avisamos primero cuando salen fechas, line-ups y lanzamientos.',
    'news.label': 'Tu email',
    'news.placeholder': 'tu@email.com',
    'news.btn': 'Suscribirme',
    'news.enviando': 'Guardando…',
    'news.ok': 'Listo, ya estás en la lista. Te escribimos cuando haya fechas nuevas.',
    'news.error': 'No pudimos guardar tu email. Probá de nuevo en un rato.',
    'news.invalido': 'Revisá el email: parece que le falta algo.',

    'pie.secciones': 'Secciones',
    'pie.redes': 'Redes',
    'pie.igsello': 'Instagram del sello',
    'pie.hecho': 'Nacida en Buenos Aires, a orillas del río',
    'pie.arriba': 'Volver arriba ↑',

    'lb.label': 'Foto ampliada',
    'lb.cerrar': 'Cerrar',
    'lb.prev': 'Foto anterior',
    'lb.next': 'Foto siguiente',

    'cursor.entradas': 'Entradas',
    'cursor.ver': 'Ver',
    'cursor.play': 'Play',
  },

  en: {
    'skip': 'Skip to dates',
    'nav.principal': 'Main',
    'nav.menu': 'Menu',
    'nav.fechas': 'Dates',
    'nav.nosotros': 'About',
    'nav.galeria': 'Gallery',
    'nav.artistas': 'Artists',
    'nav.sello': 'Label',
    'nav.contacto': 'Contact',
    'nav.entradas': 'Tickets',
    'nav.abrir': 'Open menu',
    'nav.cerrar': 'Close',

    'hero.kicker': 'From Punta Carrasco, Buenos Aires',
    'hero.claim': 'The most <em>iconic</em> electronic party',
    'hero.paises': 'Argentina · Chile · Peru · Spain',
    'hero.bajar': 'Scroll',

    'next.label': 'Next date',
    'next.btn': 'Get tickets',
    'next.none': 'New dates coming soon',
    'next.none.sub': 'Subscribe and we’ll let you know as soon as they’re out.',
    'next.none.btn': 'Notify me',

    'fechas.eyebrow': 'Schedule',
    'fechas.title': 'Dates',
    'fechas.pais': 'Filter by country',
    'fechas.todas': 'All',
    'fechas.todos': 'All',
    'fechas.resumen.1': '1 upcoming date',
    'fechas.resumen.n': '{n} upcoming dates',
    'fechas.resumen.0': 'Schedule',
    'fechas.entradas': 'Tickets',
    'fechas.sinlink': 'Tickets soon',
    'fechas.compartir': 'Share',
    'fechas.agendar': 'Add to calendar',
    'fechas.copiado': 'Link copied',
    'fechas.vacio.t': 'No dates announced yet',
    'fechas.vacio.pais': 'No dates in {pais} yet',
    'fechas.vacio.p': 'New dates go out first on the newsletter and on Instagram.',
    'fechas.vacio.cta': 'Tell me first',
    'fechas.pasadas': 'Recently at Río',
    'fechas.flyer': '{h} flyer',

    'nos.eyebrow': 'About Río',
    'nos.manifiesto': `Río was born in Buenos Aires, <em>on the riverbank</em> ${PILL('dsc01112')}. At Punta Carrasco we brought together nature ${PILL('dsc01966')}, the river and the best music in the world ${PILL('dsc00033')}: summer and underground, international and local. Today the party travels across Argentina, Chile, Peru and Spain ${PILL('dsc02040')}.`,
    'nos.voz': 'Summer meets underground.',
    'nos.p2': 'Since its early days at Punta Carrasco, Río has hosted the best international DJs in unique locations. An experience that blends the international with the local, and that now also happens in Chile, Peru and Spain.',
    'nos.verartistas': 'See featured artists',
    'nos.fotoalt': 'Two DJs greet the crowd from the Río booth, next to a flamingo',

    'gal.eyebrow': 'Gallery',
    'gal.t1': 'From night',
    'gal.t2': 'to sunrise',
    'gal.intro': 'Twelve photos from one party, in the order they were taken.',
    'gal.noche': 'Night',
    'gal.amanecer': 'Sunrise',
    'gal.ver': 'View photo: {alt}',
    'gal.tiempo': '{t} after the first photo',

    'tv.eyebrow': 'Full sets',
    'tv.intro': 'Recorded at our parties, start to finish. Hit play and keep browsing: the set stays with you.',
    'tv.canal': 'Visit the channel',
    'tv.vistas': 'views',
    'tv.play': 'Play {dj}’s set',
    'tv.cerrar': 'Close player',
    'tv.volver': 'Back to Río TV',
    'tv.verEnYoutube': 'Watch {dj}’s set on YouTube',

    'vista.badge': 'Redesign proposal · preview',
    'vista.simular': 'Simulate upcoming dates',
    'vista.real': 'Show real dates',
    'news.vista': 'Preview: on the live site, your email is saved here.',

    'art.eyebrow': 'Line-ups',
    'art.title': 'Featured artists',
    'art.intro': 'The best international DJs, in unique locations.',

    'sello.eyebrow': 'Label',
    'sello.p': 'Río’s record label: original releases, remixes and compilations from the artists who play our parties.',
    'sello.beatport': 'The label’s full catalogue',
    'sello.plataformas': 'Every platform',
    'sello.ingrv': 'Spotify, Apple Music, Tidal, Deezer and more, in one link (Ingrv)',
    'sello.ig': 'Label Instagram',
    'sello.igdesc': 'Release previews, behind the scenes and news',

    'news.eyebrow': 'Newsletter',
    'news.title': 'Don’t miss <em class="voz">a thing</em>',
    'news.p': 'Subscribe and be the first to hear about new dates, line-ups and releases.',
    'news.label': 'Your email',
    'news.placeholder': 'you@email.com',
    'news.btn': 'Subscribe',
    'news.enviando': 'Saving…',
    'news.ok': 'Done, you’re on the list. We’ll write when new dates drop.',
    'news.error': 'We couldn’t save your email. Please try again in a moment.',
    'news.invalido': 'Check the email address: something seems to be missing.',

    'pie.secciones': 'Sections',
    'pie.redes': 'Social',
    'pie.igsello': 'Label Instagram',
    'pie.hecho': 'Born in Buenos Aires, on the riverbank',
    'pie.arriba': 'Back to top ↑',

    'lb.label': 'Enlarged photo',
    'lb.cerrar': 'Close',
    'lb.prev': 'Previous photo',
    'lb.next': 'Next photo',

    'cursor.entradas': 'Tickets',
    'cursor.ver': 'View',
    'cursor.play': 'Play',
  },
};

const KEY = 'rio_lang'; // misma clave que usaba el sitio anterior: se respeta la elección guardada
let lang = 'es';
try {
  const saved = localStorage.getItem(KEY);
  if (saved === 'es' || saved === 'en') lang = saved;
} catch (e) { /* almacenamiento bloqueado: queda en español */ }

const listeners = new Set();

export const getLang = () => lang;
export function t(key, vars) {
  let s = (DICT[lang] && DICT[lang][key]) ?? DICT.es[key] ?? key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
}
export const onLang = (fn) => listeners.add(fn);

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

export function setLang(next) {
  if (next === lang || !DICT[next]) return;
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  applyI18n();
  listeners.forEach((fn) => fn(lang));
}
