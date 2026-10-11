# Busca dentro de "tiendas 247.zip" los modelos/texturas del juego que contienen la marca 24/7
# (franja verde, logo, letrero "24/7 SUPERMARKET", posters) y los copia a marca_247/ en el repo.
# Uso:  python herramientas/buscar_marca_247.py "C:\Users\kedag\OneDrive\Escritorio\tiendas 247.zip"
import sys, os, zipfile, zlib
ZIP = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'marca_247')
os.makedirs(OUT, exist_ok=True)
KEYS = [b'mall95', b'im_signs18', b'247_posters', b'gz_v_247', b'supermarket', b'_247_', b'247sign', b'247_sign', b'247logo', b'247_logo']
hits = []
with zipfile.ZipFile(ZIP) as z:
    for info in z.infolist():
        name = os.path.basename(info.filename)
        if not name.lower().endswith(('.ydr', '.ytd', '.ydd')) or info.file_size > 95 * 1024 * 1024:
            continue
        data = z.read(info)
        body = data
        if data[:4] == b'RSC7':
            try: body = zlib.decompressobj(-15).decompress(data[16:])
            except Exception: pass
        low = body.lower()
        found = [k.decode() for k in KEYS if k in low]
        if found:
            dst = os.path.join(OUT, name)
            if os.path.exists(dst):
                dst = os.path.join(OUT, info.filename.replace('/', '_').replace('\\', '_'))
            open(dst, 'wb').write(data)
            hits.append((name, len(data), found))
for n, s, f in hits:
    print(f'{n:60s} {s/1024:8.0f} KB  {",".join(f)}')
print(len(hits), 'archivos copiados a', os.path.abspath(OUT))
