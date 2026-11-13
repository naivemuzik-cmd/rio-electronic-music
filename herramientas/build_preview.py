"""Arma la copia liviana del sitio para publicarla como Artifact (vista previa privada).

usage: python build_preview.py <proyecto> <salida>
- Sin <html>/<head>/<body> propios (el visor los agrega), con <title> arriba.
- Fuentes desde Google Fonts (el visor no deja cargar fuentes propias).
- Flyers del panel convertidos a WebP liviano y eventos.json apuntando a esas copias.
"""
import sys, os, re, json, shutil
from PIL import Image

PROJ, OUT = sys.argv[1], sys.argv[2]
assert os.path.abspath(OUT) != os.path.abspath(PROJ), 'la salida no puede ser la carpeta del proyecto'
# la carpeta de salida se borra y se vuelve a armar: tiene que ser una carpeta propia de la vista previa
if os.path.isdir(OUT):
    assert os.path.isfile(os.path.join(OUT, 'eventos', 'eventos.json')), 'la salida existe y no parece una vista previa anterior'
    shutil.rmtree(OUT)
os.makedirs(OUT)

for sub in ['assets/css', 'assets/js', 'assets/img/fotos', 'assets/img/tv']:
    shutil.copytree(os.path.join(PROJ, sub), os.path.join(OUT, sub))
os.makedirs(os.path.join(OUT, 'assets/img/brand'))
for f in ['logo-rio.png', 'logo-rio@2x.png', 'logo-neon.png']:
    shutil.copy2(os.path.join(PROJ, 'assets/img/brand', f), os.path.join(OUT, 'assets/img/brand', f))

# flyers → WebP
os.makedirs(os.path.join(OUT, 'img')); os.makedirs(os.path.join(OUT, 'eventos'))
data = json.load(open(os.path.join(PROJ, 'eventos/eventos.json'), encoding='utf-8'))
for ev in data['eventos']:
    src = ev.get('imagen') or ''
    if not src:
        continue
    base = os.path.splitext(os.path.basename(src))[0]
    im = Image.open(os.path.join(PROJ, src)).convert('RGB')
    im.thumbnail((720, 1200), Image.LANCZOS)
    im.save(os.path.join(OUT, 'img', base + '.webp'), quality=80, method=6)
    ev['imagen'] = f'img/{base}.webp'
json.dump(data, open(os.path.join(OUT, 'eventos/eventos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# CSS sin @font-face (las fuentes vienen de Google Fonts)
css_path = os.path.join(OUT, 'assets/css/main.css')
css = open(css_path, encoding='utf-8').read()
css, n = re.subn(r'@font-face\s*\{[^}]*\}\s*', '', css)
open(css_path, 'w', encoding='utf-8').write(css)

# index.html sin esqueleto propio
html = open(os.path.join(PROJ, 'index.html'), encoding='utf-8').read()
body = html[html.index('<body>') + len('<body>'):html.rindex('</body>')]
# librerías desde el CDN permitido por el visor (versiones fijas, de hace más de dos semanas)
cdn = {
    'assets/vendor/gsap.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js',
    'assets/vendor/ScrollTrigger.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/ScrollTrigger.min.js',
    'assets/vendor/SplitText.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/SplitText.min.js',
    'assets/vendor/lenis.min.js': 'https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js',
}
for local_src, url in cdn.items():
    assert f'src="{local_src}"' in body, local_src
    body = body.replace(f'src="{local_src}"', f'src="{url}"')
head = """<title>Rediseño Río Electronic Music</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Fraunces:ital,opsz,wght,SOFT,WONK@1,9..144,300..900,0..100,0..1&display=swap">
<link rel="stylesheet" href="assets/css/main.css">
<script>
  document.documentElement.classList.add('js');
  setTimeout(function () { document.documentElement.classList.add('is-loaded'); }, 7000);
</script>
"""
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(head + body.strip() + '\n')

files = []
total = 0
for root, _, names in os.walk(OUT):
    for nm in names:
        p = os.path.join(root, nm)
        rel = os.path.relpath(p, OUT).replace('\\', '/')
        total += os.path.getsize(p)
        if rel != 'index.html':
            files.append({'path': rel})
files.sort(key=lambda x: x['path'])
json.dump(files, open(os.path.join(os.path.dirname(OUT), 'preview-files.json'), 'w'), separators=(',', ':'))
print('font-face quitados:', n, '| archivos de soporte:', len(files), '| total MB:', round(total / 1048576, 2))
