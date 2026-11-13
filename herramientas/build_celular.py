"""Arma la versión liviana del sitio (la "de celular") para publicarla en GitHub Pages.

usage: python build_celular.py <proyecto> <salida>
- Copia el sitio tal cual: HTML completo, fuentes y librerías propias.
- Pasa los flyers del panel a WebP liviano, y eventos.json apunta a esas copias.
- Deja afuera /admin, las herramientas y el README del proyecto. Agrega noindex, .nojekyll y su propio README.
- Se puede volver a correr sobre la misma carpeta: conserva .git y solo borra lo que armó antes.
"""
import sys, os, json, shutil
from PIL import Image

PROJ, OUT = (os.path.abspath(p) for p in sys.argv[1:3])
assert OUT != PROJ and not OUT.startswith(PROJ + os.sep), 'la salida tiene que estar fuera del proyecto'
MARCA = '.build-celular'

os.makedirs(OUT, exist_ok=True)
previos = [n for n in os.listdir(OUT) if n != '.git']
if previos:
    assert os.path.isfile(os.path.join(OUT, MARCA)), 'la carpeta de salida tiene otras cosas: no la toco'
    for n in previos:
        p = os.path.join(OUT, n)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)

shutil.copytree(os.path.join(PROJ, 'assets'), os.path.join(OUT, 'assets'))
for f in ['favicon.ico', 'manifest.webmanifest']:
    shutil.copy2(os.path.join(PROJ, f), os.path.join(OUT, f))

# flyers → WebP liviano
os.makedirs(os.path.join(OUT, 'img'))
os.makedirs(os.path.join(OUT, 'eventos'))
data = json.load(open(os.path.join(PROJ, 'eventos', 'eventos.json'), encoding='utf-8'))
for ev in data.get('eventos', []):
    src = ev.get('imagen') or ''
    if not src:
        continue
    base = os.path.splitext(os.path.basename(src))[0]
    im = Image.open(os.path.join(PROJ, src)).convert('RGB')
    im.thumbnail((720, 1200), Image.LANCZOS)
    im.save(os.path.join(OUT, 'img', base + '.webp'), quality=80, method=6)
    ev['imagen'] = f'img/{base}.webp'
json.dump(data, open(os.path.join(OUT, 'eventos', 'eventos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# HTML completo + noindex (es una copia de prueba)
html = open(os.path.join(PROJ, 'index.html'), encoding='utf-8').read()
vp = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
assert vp in html
html = html.replace(vp, vp + '\n<meta name="robots" content="noindex">', 1)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)

open(os.path.join(OUT, '.nojekyll'), 'w').close()
open(os.path.join(OUT, MARCA), 'w', encoding='utf-8').write('Carpeta generada por herramientas/build_celular.py\n')
open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8').write("""# Río Electronic Music: versión liviana (vista previa)

Copia de prueba del rediseño de rioelectronicmusic.com para mirar desde el celular. Es el mismo sitio que el repo
oficial ([rio-electronic-music](https://github.com/naivemuzik-cmd/rio-electronic-music)), pero con los flyers en WebP
livianos: pasan de ~3,5 MB a ~130 KB cada uno.

**Link:** https://naivemuzik-cmd.github.io/rio-electronic-music-preview/

- Fuera del dominio real muestra la etiqueta "Propuesta de rediseño · vista previa" y un botón para simular fechas
  próximas. El newsletter no guarda emails y Google no la indexa.
- Las fechas son una copia del panel al 13-nov-2026 y no se actualizan solas. El sitio de verdad es el repo oficial.
- Se vuelve a armar con `herramientas/build_celular.py` del repo oficial.
""")

total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) if '.git' not in r.split(os.sep) for f in fs)
print('listo:', OUT, '|', round(total / 1048576, 2), 'MB')
