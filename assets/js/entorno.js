// Dónde está corriendo la página. Define qué funciones se activan:
//  · produccion: el dominio real o Netlify → CDN de imágenes, newsletter real, videos embebidos.
//  · local: la compu (localhost) → igual que producción, pero el newsletter se simula y no hay CDN.
//  · vista: cualquier otro lugar (un link de vista previa) → sin embeds ni envíos, y se marca como propuesta.
// En la compu, ?entorno=vista permite probar cómo se ve el link de vista previa.
const h = location.hostname;
const local = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(h) || location.protocol === 'file:';
const forzado = local ? new URLSearchParams(location.search).get('entorno') : null;

export const ENTORNO =
  forzado === 'vista' ? 'vista'
  : /(^|\.)rioelectronicmusic\.com$|\.netlify\.app$/.test(h) ? 'produccion'
  : local ? 'local'
  : 'vista';

// Vista previa dentro de un iframe (el visor de Claude): ahí no se pueden embeber videos,
// usar "Compartir" del sistema ni descargar archivos. En GitHub Pages (pestaña normal) sí.
let enIframe = false;
try { enIframe = window.self !== window.top; } catch (e) { enIframe = true; }
export const EN_VISOR = ENTORNO === 'vista' && enIframe;
