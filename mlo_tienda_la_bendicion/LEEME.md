# MLO "Tienda La Bendición" (antes 24/7 Supermarket)

Recurso FiveM listo para usar: copia la carpeta `tienda_la_bendicion/` a `resources/` y agrega
`ensure tienda_la_bendicion` en tu `server.cfg`. **Quita el recurso viejo `anarchy_247`** (los dos reemplazan
los mismos archivos y chocarían).

## Qué cambió

| Antes (24/7) | Ahora |
|---|---|
| Paredes verdes | Amarillo mostaza tipo yeso pintado (como la foto de referencia) |
| Techo verde | Techo blanco |
| Franjas naranja/rojo/verde | Franjas terracota / blanco / rojo ladrillo |
| Letreros "24/7 SUPERMARKET" | "TIENDA LA BENDICIÓN" con emblema de arco + cruz |
| CHILLED FOOD / COLD BEER / SELF SERVICE | REFRIGERADOS / BEBIDAS FRÍAS / AUTOSERVICIO |
| OPEN / BEER / CANDY / FRUIT | ABIERTO / BEBIDAS / DULCES / FRUTAS |
| Pósters con logo 24/7 | Pósters con encabezado y pie "Tienda La Bendición" |
| Fachada negra con borde verde | Fachada amarilla, bordes blancos, techo de teja de barro y letrero al frente y al costado |

## Comida eliminada (tienda vacía)

- Pared de refris vanilla `v_66_fridge` (traía las bebidas pegadas al modelo) → **`bend_chiller_wall`**:
  2 vitrinas refrigeradas abiertas, 4 repisas cada una, **vacías**.
- 4 refris de bebidas (`ba_prop_battle_bar_beerfridge_01` x2, `prop_bar_fridge_01`, `prop_vend_fridge01`) →
  4 **`bend_chiller`** vacíos.
- Estantes de licor con botellas (`v_ret_ml_liqshelfa/d`) → 2 **`bend_shelf`** (góndola de doble cara, 4 repisas, vacía).
- Eliminados: 7 botellas de whisky, banana, vaso de soda, cubeta de hielo, exhibidor de donas, rack de cigarros
  y los 3 exhibidores de farmacia (`pharmstuff`, `pharmbetta`, `pharmdeo`).
- El congelador ovalado del centro y las repisas blancas del mostrador ya venían vacíos.

Los props nuevos tienen colisión en cada repisa, así que los scripts de colocación (raycast) apoyan los items encima.

## Alturas para poner tus items (tienda de Strawberry)

El MLO está en `27.2485, -1343.679, 28.497` sin rotación, así que coordenada mundo = esa posición + la local.

| Mueble | Centro (X, Y) | Mira hacia | Superficies Z (piso de la vitrina → repisa 4) |
|---|---|---|---|
| `bend_chiller_wall` (pared izquierda, 4.6 m) | 23.81, -1345.87 | +X | 28.94 · 29.24 · 29.61 · 29.97 · 30.34 |
| `bend_chiller` #1–#4 (pared derecha) | 34.46, Y = -1345.23 / -1346.06 / -1346.89 / -1347.72 | −X | 28.91 · 29.21 · 29.54 · 29.87 · 30.20 |
| `bend_shelf` #1 | 23.89, -1339.96 | ambos lados | 29.00 · 29.40 · 29.80 · 30.20 |
| `bend_shelf` #2 | 34.21, -1339.97 | ambos lados | 29.00 · 29.40 · 29.80 · 30.20 |

Profundidad útil: vitrinas unos 0.40–0.55 m desde el fondo; góndola 0.22 m por lado.

> El ytyp `v_int_66` reemplaza al interior vanilla `v_shop_247` (igual que el mapeo original, "ALL 247").
> Todas las 24/7 que usan ese interior salen con el nuevo diseño. En las otras tiendas las alturas
> son las mismas (relativas al piso); solo cambian X/Y.

## Optimización

- Pesa **3.2 MB** (el original pesaba 3.6 MB), aun con 3 modelos nuevos y una textura más.
- Todas las texturas llevan mipmaps completos (menos parpadeo de lejos y menos uso de VRAM).
  Las DXT5 sin transparencia pasaron a DXT1 (la mitad de memoria).
- Las texturas que se ven chicas (revistas, periódicos, pósters, grava) bajaron de 512 a 256 px.
- Los 3 props nuevos comparten **una sola** textura (`bend_props_txd.ytd`) en vez de llevar una copia cada uno.
- Se quitaron 15 entidades (comida) y una definición duplicada de `light_fb` que tenía la caja de colisión mal.
- Se quitó el archivo de spam de Discord del recurso.

## Lo que no se tocó

- Props vanilla que no son comida: ATM, máquinas de slush/jugo, lotería, revistas, carritos,
  basureros, casillero, escritorio, cámaras y reloj.
- 3 entidades con nombre desconocido (`hash_D712F48D` x2 y `hash_10181D02`) que no pude identificar.
  Probablemente sean props de DLC; si al entrar ves algo con comida en el piso frente al mostrador o
  junto a la entrada, ese es el que hay que borrar.
- Los letreros exteriores "24/7" que trae GTA en los edificios vanilla de otras tiendas están en los
  archivos del juego, no en este recurso.

`texturas_png/` tiene las texturas nuevas en PNG por si quieres retocar colores o textos.
