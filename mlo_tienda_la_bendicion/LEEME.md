# MLO "Tienda La Bendición" (antes 24/7 Supermarket) — v3

Para instalarlo, copia la carpeta `tienda_la_bendicion/` a `resources/` y pon `ensure tienda_la_bendicion` en tu `server.cfg`.
**Reemplaza la versión anterior y quita el recurso viejo `anarchy_247`**, porque pisan los mismos archivos.

## Qué se corrigió en la v3 (tu reporte)

| Problema | Causa | Solución |
|---|---|---|
| La fachada seguía siendo la 24/7 verde | La fachada de Strawberry es el edificio vanilla del juego (`sc1_03_247`), no venía en el mapeo. El exterior que sí traía (`cs4_10_247`) es la 24/7 de **Sandy Shores** | Se agregó una fachada nueva encima del edificio vanilla: letrero grande "TIENDA LA BENDICIÓN" que tapa "24/7 SUPERMARKET" y "OPEN 24 HOURS" (y brilla de noche), revestimiento amarillo, molduras blancas en ventanas y puerta, y techo de teja. Ver `previews/1_fachada_antes_despues.png` |
| Las ventanas decían 24/7 | Las ventanas eran los modelos vanilla `v_ret_247_win1/2/3`, con calcomanías 24/7 | Ventanas propias de vidrio con calcomanías "TIENDA LA BENDICIÓN", "ABIERTO" y "¡BIENVENIDOS!", a la medida exacta de las aberturas. La colisión es de vidrio antibalas |
| El reflejo del piso mostraba edificios de afuera | El mapeo traía un piso espejo con 2 portales espejo marcados "el espejo puede ver el exterior" | Se quitaron el piso espejo y sus portales. Además mejora el rendimiento: un espejo dibuja la escena dos veces |
| Objetos invisibles / la oficina no dejaba entrar | En la colisión había un **mueble fantasma** de 1.73 m de alto, pegado a la pared del fondo. El autor lo borró del modelo pero no de la colisión, y dejaba 58 cm de paso hacia la oficina | Se borraron esos 99 triángulos (nada más), así que ahora hay 80 cm de paso. También se movió el estante izquierdo, que tapaba el casillero, y se corrigió un desfase de 6 cm entre colisión y paredes que ya traía el mapeo |

Además se amplió la caja de la sala para que el carril de caja, la oficina y el fondo cuenten como dentro de la tienda.
En el mapa de caminabilidad con colisión real (`previews/7_mapa_caminable.png`) se llega a todo con el tamaño de un jugador:
entrada, pasillos, caja, oficina, casillero, vitrinas y enfriadores.

## Qué NO se cambió y por qué

- **Puertas** (`v_ilev_247door`): las tiras verdes "SUPERMARKET" vienen dentro del modelo vanilla de la puerta. Ese modelo se usa en todas
  las 24/7 del mapa, y los scripts de cerraduras y robos lo buscan por nombre, así que reemplazarlo podría romperlos. Hay dos opciones:
  1. Si abres CodeWalker (con tu GTA) y nos mandas los nombres de textura de `v_ilev_247door.ydr`, hacemos un script que
     cambie solo esas texturas.
  2. Hacer puertas propias. Ojo: hay que reconfigurar las cerraduras de las 24/7.
- **Otras 24/7 del mapa**: el interior nuevo sale en todas (comparten el mismo interior). La fachada nueva solo está en Strawberry,
  y el exterior de Sandy Shores ya venía rediseñado desde la v2. Si quieres la fachada nueva en otra tienda, dime cuál.
- **Banquitos detrás de la caja**: las 2 entidades `hash_D712F48D` son `sf_int1_bar_stool1` (DLC The Contract). Se ven si tu
  servidor usa ese game build o uno más nuevo.

## Muebles vacíos para tus items (tienda de Strawberry)

El MLO está en `27.2485, -1343.679, 28.497` sin rotación, así que coordenada mundo = esa posición + la local.

| Mueble | Centro (X, Y) | Mira hacia | Superficies Z (fondo de vitrina → repisa 4) |
|---|---|---|---|
| `bend_chiller_wall` (pared izquierda, 4.6 m) | 23.81, -1345.87 | +X | 28.94 · 29.24 · 29.61 · 29.97 · 30.34 |
| `bend_chiller` #1–#4 (pared derecha) | 34.46, Y = -1345.23 / -1346.06 / -1346.89 / -1347.72 | −X | 28.91 · 29.21 · 29.54 · 29.87 · 30.20 |
| `bend_shelf` #1 (fondo, junto a la caja) | 25.20, -1339.44 | ambos lados (±Y) | 29.00 · 29.40 · 29.80 · 30.20 |
| `bend_shelf` #2 (oficina) | 34.21, -1339.97 | ambos lados (±X) | 29.00 · 29.40 · 29.80 · 30.20 |

Las repisas tienen colisión, así que los scripts de colocación apoyan los items encima.

## Archivos

- `tienda_la_bendicion/stream/`
  - `v_int_66.ytyp` (interior), `v_66_shop711.ydr` (cuarto), `v_shop_247.ybn` (colisión corregida)
  - Muebles: `bend_chiller*.ydr`, `bend_shelf.ydr`. Ventanas: `bend_win_*.ydr`. Comparten la textura `bend_props_txd.ytd`
  - Fachada de Strawberry: `bend_ext_strawberry.ydr/.ymap`, `bend_ext.ytyp`, `bend_ext_txd.ytd`
  - Exterior de Sandy Shores: `cs4_10_247.ydr` + `lr_cs4_10_3.ybn`
- `previews/`: antes/después de la fachada (simulación proyectada sobre tu captura), interior y mapa caminable.
- `texturas_png/`: todas las texturas nuevas en PNG, por si quieres retocar colores o textos.

Pesa 3.5 MB en total. Todas las texturas llevan mipmaps, las que no usan transparencia van en DXT1, y los muebles y ventanas comparten una sola textura.
