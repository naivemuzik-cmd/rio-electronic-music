"""Optimise the event photos + brand images for the new Río site.

usage: python build_images.py <photos_dir> <site_img_dir(old site img)> <project_dir>
Writes AVIF + WebP variants, LQIP placeholders, average colours and a JS data module.
"""
import sys, os, io, json, base64, colorsys
from datetime import datetime
from PIL import Image, ImageOps, ImageFilter, ImageDraw, ImageEnhance, ImageStat

SRC, OLD, PROJ = sys.argv[1], sys.argv[2], sys.argv[3]
OUT = os.path.join(PROJ, 'assets', 'img', 'fotos')
BRAND = os.path.join(PROJ, 'assets', 'img', 'brand')
os.makedirs(OUT, exist_ok=True); os.makedirs(BRAND, exist_ok=True)

GALLERY = [
    ('DSC01112', 'Cabina de DJ entre helechos y flamencos, con el neón de Río y luces verdes',
                 'DJ booth among ferns and flamingos, with the Río neon sign and green lights'),
    ('DSC01311', 'DJ iluminado de verde entre flamencos y plantas',
                 'DJ lit in green between flamingos and plants'),
    ('DSC01506', 'Escenario con luces azules y el público frente a la pantalla',
                 'Stage washed in blue light with the crowd in front of the screen'),
    ('DSC01590', 'DJ bajo luces magenta en la cabina, junto a un flamenco',
                 'DJ under magenta lights in the booth, next to a flamingo'),
    ('DSC01693', 'Una chica baila bajo luces azules',
                 'A girl dances under blue lights'),
    ('DSC01966', 'La multitud de noche entre palmeras iluminadas de verde',
                 'The crowd at night between palm trees lit in green'),
    ('DSC02040', 'DJ con luces magenta y el neón de Río sobre el público',
                 'DJ in magenta light with the Río neon above the crowd'),
    ('DSC02155', 'DJ de espaldas frente al público, entre flamencos y luces azules',
                 'DJ seen from behind facing the crowd, between flamingos and blue lights'),
    ('DSC02258', 'La cabina con humo y la pantalla encendida mientras aclara',
                 'The booth with smoke and the screen on as the sky gets lighter'),
    ('DSC02371', 'Cielo nublado sobre las palmeras y la multitud',
                 'Cloudy sky over the palm trees and the crowd'),
    ('DSC00033', 'Cañones de humo frío sobre la gente, con un árbol enorme de fondo',
                 'CO2 cannons over the crowd, with a huge tree behind'),
    ('DSC00143', 'DJ a contraluz con el brazo en alto frente a la multitud y las palmeras',
                 'Backlit DJ with an arm raised facing the crowd and the palm trees'),
]
EXTRA = {  # other photos used around the page
    'DSC02377': 'hero',
    'DSC00136': 'dj-contraluz',
    'DSC09980': 'escenario-dia',
    'DSC01803': 'pantalla-led',
}
PILLS = ['DSC01112', 'DSC00033', 'DSC02040', 'DSC01966']


def load(name):
    im = Image.open(os.path.join(SRC, name + '.jpg'))
    ex = im.getexif()
    dt = ex.get_ifd(0x8769).get(0x9003) if ex else None
    return ImageOps.exif_transpose(im).convert('RGB'), dt


def save_variants(im, base, long_edges, q_avif=58, q_webp=78):
    out = []
    for le in long_edges:
        r = le / max(im.size)
        v = im if r >= 1 else im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        v = v.filter(ImageFilter.UnsharpMask(radius=0.6, percent=40, threshold=2)) if r < 0.9 else v
        stem = f'{base}-{v.width}'
        v.save(os.path.join(OUT, stem + '.avif'), quality=q_avif, speed=6)
        v.save(os.path.join(OUT, stem + '.webp'), quality=q_webp, method=6)
        out.append({'w': v.width, 'h': v.height, 'stem': stem})
    return out


def lqip(im):
    t = im.copy(); t.thumbnail((20, 20))
    b = io.BytesIO(); t.save(b, 'WEBP', quality=40)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


def mood_color(im):
    """Average of the saturated pixels, pushed dark — used as the section background."""
    t = im.copy(); t.thumbnail((80, 80))
    px = list(t.getdata())
    best = []
    for r, g, b in px:
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s > 0.35 and 0.12 < l < 0.85:
            best.append((r, g, b))
    if len(best) < 20:
        best = px
    r = sum(p[0] for p in best) / len(best); g = sum(p[1] for p in best) / len(best); b = sum(p[2] for p in best) / len(best)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    r2, g2, b2 = colorsys.hls_to_rgb(h, 0.085, min(1.0, s * 0.9 + 0.1))
    return '#%02x%02x%02x' % (round(r2 * 255), round(g2 * 255), round(b2 * 255))


data = {'gallery': [], 'extra': {}, 'pills': {}}
t0 = None
for name, es, en in GALLERY:
    im, dt = load(name)
    ts = datetime.strptime(dt, '%Y:%m:%d %H:%M:%S') if dt else None
    t0 = t0 or ts
    variants = save_variants(im, 'g-' + name.lower(), [1600, 900])
    data['gallery'].append({
        'id': name, 'w': im.width, 'h': im.height, 'v': variants, 'lqip': lqip(im),
        'color': mood_color(im), 'min': round((ts - t0).total_seconds() / 60) if ts else None,
        'alt': {'es': es, 'en': en},
    })
    print('gallery', name, data['gallery'][-1]['color'], data['gallery'][-1]['min'])

for name, slug in EXTRA.items():
    im, _ = load(name)
    edges = [2048, 1200] if slug == 'hero' else [1600, 900]
    data['extra'][slug] = {'w': im.width, 'h': im.height, 'v': save_variants(im, slug, edges, q_avif=60, q_webp=80),
                           'lqip': lqip(im), 'color': mood_color(im)}
    print('extra', slug, im.size)

for name in PILLS:
    im, _ = load(name)
    s = min(im.size); left = (im.width - s) // 2; top = (im.height - s) // 2
    sq = im.crop((left, top, left + s, top + s)).resize((360, 360), Image.LANCZOS)
    stem = 'pill-' + name.lower()
    sq.save(os.path.join(OUT, stem + '.avif'), quality=55, speed=6)
    sq.save(os.path.join(OUT, stem + '.webp'), quality=76, method=6)
    data['pills'][name] = stem

# old-site photo (two DJs in the Río booth)
sobre = Image.open(os.path.join(OLD, 'sobre-foto.png')).convert('RGB')
data['extra']['sobre'] = {'w': sobre.width, 'h': sobre.height, 'v': save_variants(sobre, 'sobre-cabina', [1417, 800]),
                          'lqip': lqip(sobre), 'color': mood_color(sobre)}

# ---- brand: logo texture, favicons, og image
logo = Image.open(os.path.join(OLD, 'logo-rio.png')).convert('RGBA')
logo2 = logo.resize((logo.width * 2, logo.height * 2), Image.LANCZOS)
logo2.save(os.path.join(BRAND, 'logo-rio@2x.png'), optimize=True)
logo.save(os.path.join(BRAND, 'logo-rio.png'), optimize=True)

bbox = logo.getbbox()
cx, cy = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
script = logo.crop((round(cx - 112), round(cy - 70), round(cx + 112), round(cy + 72)))  # the "Río" script only
script = script.crop(script.getbbox())


def icon(size, pad=0.2, round_bg=True):
    base = Image.new('RGBA', (size * 4, size * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    if round_bg:
        d.ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=(12, 31, 26, 255))
    else:
        d.rectangle((0, 0, size * 4, size * 4), fill=(12, 31, 26, 255))
    inner = int(size * 4 * (1 - 2 * pad))
    s = script.copy(); s.thumbnail((inner, inner), Image.LANCZOS)
    base.alpha_composite(s, ((size * 4 - s.width) // 2, (size * 4 - s.height) // 2))
    return base.resize((size, size), Image.LANCZOS)


icon(32, 0.12).save(os.path.join(BRAND, 'favicon-32.png'))
icon(180, 0.16, round_bg=False).save(os.path.join(BRAND, 'apple-touch-icon.png'))
icon(192, 0.16).save(os.path.join(BRAND, 'icon-192.png'))
icon(512, 0.16).save(os.path.join(BRAND, 'icon-512.png'))
icon(512, 0.24, round_bg=False).save(os.path.join(BRAND, 'icon-maskable-512.png'))
icon(48, 0.1).save(os.path.join(PROJ, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])

hero, _ = load('DSC02377')
W, H = 1200, 630
scale = W / hero.width
band = hero.resize((W, round(hero.height * scale)), Image.LANCZOS)
top = round(band.height * 0.20)
og = band.crop((0, top, W, top + H))
og = ImageEnhance.Brightness(og).enhance(0.62)
grad = Image.new('L', (1, H))
for y in range(H):
    grad.putpixel((0, y), int(255 * min(1, max(0, (y - H * 0.35) / (H * 0.65))) ** 1.4 * 0.85))
dark = Image.new('RGB', (W, H), (6, 17, 14))
og = Image.composite(dark, og, grad.resize((W, H)))
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse((W / 2 - 190, H * 0.47 - 190, W / 2 + 190, H * 0.47 + 190), fill=(255, 184, 107, 120))
glow = glow.filter(ImageFilter.GaussianBlur(70))
og = og.convert('RGBA'); og.alpha_composite(glow)
lg = logo.copy(); lg.thumbnail((330, 330), Image.LANCZOS)
og.alpha_composite(lg, ((W - lg.width) // 2, round(H * 0.47 - lg.height / 2)))
og.convert('RGB').save(os.path.join(BRAND, 'og-rio.jpg'), quality=86, optimize=True, progressive=True)

with open(os.path.join(PROJ, 'assets', 'js', 'data-fotos.js'), 'w', encoding='utf-8') as f:
    f.write('// Generado por build_images.py — fotos optimizadas (AVIF + WebP) con placeholder y color de ambiente.\n')
    f.write('export const FOTOS = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print('done')
