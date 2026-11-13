# Río Electronic Music: rediseño del sitio

Nueva versión de **rioelectronicmusic.com**. Es un sitio estático, sin paso de compilación, pensado para reemplazar
al actual en el mismo Netlify **sin romper el panel `/admin`** (Decap CMS), que sigue editando `eventos/eventos.json`.

## Qué tiene

| Sección | Qué hace |
|---|---|
| **Hero** | WebGL2 propio: el neón de Río flota sobre el amanecer y se refleja en el río. El agua es una simulación de ondas en la GPU; el cursor o el dedo la mueven. La línea de carga se convierte en el horizonte. |
| **Fechas** | Lee `eventos/eventos.json`. Separa las **próximas** de las que **ya pasaron**, así deja de mostrar fechas viejas como próximas. Preselecciona el país del visitante por su zona horaria. Filtros por país y mes con View Transitions, el flyer sigue al cursor, botones de compartir y de agendar (.ics). En el celular las fechas son un carrusel de flyers. |
| **Ticket "Próxima fecha"** | En el hero, toma solo la fecha más cercana. Si no hay fechas, invita a suscribirse. |
| **Sobre Río** | Manifiesto que se ilumina palabra por palabra al bajar, con fotos en línea. |
| **Galería** | 12 fotos de la misma fiesta, en el orden en que se sacaron (hora de la cámara). Scroll horizontal fijado; el fondo toma el color de cada foto. Se abren en grande con View Transitions, flechas y swipe. |
| **Río TV** | Los 10 sets del canal. El video se carga recién al dar play (youtube-nocookie) y, si seguís bajando, queda en una esquina mientras navegás. |
| **Artistas destacados** | Los nombres del sitio actual, en filas que se deslizan con el scroll. |
| **Sello / Newsletter / Redes** | Beatport, Ingrv, el Instagram del sello y los Instagram por país. **El newsletter ahora guarda los emails de verdad** (Netlify Forms); el del sitio actual no los mandaba a ningún lado. |

También tiene ES/EN (respeta el idioma que el visitante ya había elegido), datos estructurados para Google (`Organization` y un
`MusicEvent` por cada fecha próxima), imagen para compartir en redes, favicon (el actual da 404), manifest para instalar
la web como app, `robots.txt` y `sitemap.xml`. Las fotos están en AVIF y WebP con placeholder borroso. Las fuentes
(Archivo y Fraunces) se sirven desde el propio sitio. Funciona con teclado y respeta "reducir movimiento".

## Probarlo en la compu

Desde esta carpeta:

```bash
python -m http.server 8823
```

y abrir http://localhost:8823. Para ver cómo queda **con fechas próximas** (hoy todas las del JSON ya pasaron),
agregar `?hoy=2026-07-01` a la dirección. Con `?gl=0` se ve la versión sin WebGL.

En local el newsletter no envía nada; publicado en Netlify, sí.

## Publicarlo en el Netlify actual

El sitio actual vive en un repo de Git conectado a Netlify (el panel usa `git-gateway`, rama `main`). En ese repo:

1. **Copiar / reemplazar**: `index.html`, la carpeta `assets/`, `favicon.ico`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml`.
2. **Opcional**: `admin/config.yml`, que agrega el campo **"Fecha exacta (con año)"**. Si se completa, la web muestra el día de la
   semana, ofrece agendar la fecha y la pasa sola a "Ya pasaron" al día siguiente. Sin ese campo, la web deduce el año
   desde "8 JUL".
3. **No tocar** `eventos/eventos.json` ni `img/`: los maneja el panel. Las copias de esta carpeta son solo para probar en local.
4. En Netlify → **Forms**: activar la detección de formularios (si no está activa) y las notificaciones del form `newsletter`.

Los flyers que se suben al panel pesan ~3,5 MB cada uno. En Netlify, la web los pide a través de su CDN de imágenes
(`/.netlify/images`), que los entrega achicados en AVIF/WebP. Si el CDN no responde, se usa el archivo original.

## Dónde corre y qué cambia (`assets/js/entorno.js`)

- **Producción** (`rioelectronicmusic.com` o `*.netlify.app`): todo activo. Usa el CDN de imágenes, el newsletter guarda emails y los sets se ven embebidos.
- **Local** (`localhost`): igual que producción, salvo que el newsletter se simula y los flyers se cargan sin CDN.
- **Vista previa** (cualquier otro dominio, por ejemplo el link privado de Claude): aparece la etiqueta
  "Propuesta de rediseño · vista previa" con un botón para simular fechas próximas. Los sets se abren en YouTube,
  el newsletter avisa que es una prueba y no se ofrece descargar el .ics. En local se fuerza con `?entorno=vista`.

## En GitHub

- **Oficial** (este repo, el código para Netlify): https://github.com/naivemuzik-cmd/rio-electronic-music. Se ve en https://naivemuzik-cmd.github.io/rio-electronic-music/
- **Liviana, para el celular** (flyers en WebP): https://github.com/naivemuzik-cmd/rio-electronic-music-preview. Se ve en
  https://naivemuzik-cmd.github.io/rio-electronic-music-preview/. Se vuelve a armar con
  `herramientas/build_celular.py <esta carpeta> <carpeta del repo liviano>`.

En GitHub Pages el sitio funciona como vista previa: lleva la etiqueta de propuesta, no guarda emails y Google no lo
indexa. Los videos de Río TV sí se reproducen embebidos.

## Vista previa privada

Link de prueba (privado, solo lo abre el dueño de la cuenta hasta que se comparta desde el menú Compartir):
https://claude.ai/artifact/2KKwiGBVCsBErSzM3zARHR

Se arma con `herramientas/build_preview.py <esta carpeta> <carpeta de salida>`. Ese script:
- pasa los flyers a WebP;
- carga las fuentes desde Google Fonts y las librerías desde cdnjs/jsDelivr;
- saca el `<head>` propio, porque el visor agrega el suyo.

`herramientas/` no se sube al sitio; ahí también está `build_images.py`, que optimiza las fotos de la galería.

## Datos a mano

- **Sets de Río TV**: `assets/js/tv.js` (id de YouTube, DJ, lugar, año, vistas a noviembre de 2026).
- **Artistas destacados**: lista `ARTISTAS` en `assets/js/main.js`.
- **Textos ES/EN**: `assets/js/i18n.js`.
- **Fotos de la galería**: las genera `herramientas/build_images.py` (Pillow); el resultado está en `assets/js/data-fotos.js`.

## Tecnología

HTML + CSS moderno (fuentes variables, `color-mix`, Popover API, `@starting-style`, `<dialog>`, View Transitions,
animación ligada al scroll en CSS) y JavaScript en módulos, sin build. WebGL2 a mano para el hero. GSAP 3.15.0
(ScrollTrigger y SplitText, ahora gratis) y Lenis 1.3.27 para el scroll suave, en `assets/vendor/`.
