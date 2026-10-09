# MLO "Tienda La Bendición" (antes 24/7 Supermarket) — v5.1

Para instalarlo, copia la carpeta `tienda_la_bendicion/` a `resources/` y pon `ensure tienda_la_bendicion` en tu `server.cfg`.
**Reemplaza la versión anterior y quita el recurso viejo `anarchy_247`**, porque pisan los mismos archivos.

## Nuevo en la v5: las 9 tiendas con fachada

- **Harmony rehecha.** En la v4 el letrero 24/7, "GROCERY" y el mural "MARKET" se veían por delante de la fachada nueva
  (`previews/fachadas/5b_harmony_en_juego_v4_vs_v5.jpg`). Con tu foto del juego y la original se midió la posición real:
  el letrero 24/7 y "GROCERY" cuelgan casi 2 m delante de la pared, y las paredes sobresalen 20-60 cm. Las piezas nuevas quedan
  35-40 cm delante de todo eso.
- **Grand Senora y Paleto Bay hechas** con tus capturas (`7_grand_senora_antes_despues.jpg`, `8_paleto_bay_antes_despues.jpg`).
- Todas las fachadas nuevas usan márgenes de profundidad grandes, aprendidos del fallo de Harmony.

## Nuevo en la v5.1: el interior ya no cambia al 24/7 cuando te alejas

En el juego original, el interior de cada 24/7 solo se dibuja hasta **12 m**. Más lejos, el juego lo cambia por un modelo
simplificado (`<mapa>_247_lod`, dentro de `<mapa>_247_slod_children.ydd`) que lleva una "foto" del interior viejo: anaqueles
llenos, paredes rojas y logos 24/7. Con los archivos que exportaste de CodeWalker se rehízo esa foto con **nuestro** interior
(paredes amarillas, techo, piso y anaqueles vacíos) y se reemplazaron los modelos de lejos de las 9 tiendas: archivos
`*_247_slod_children.ydd` en `stream/` (unos 165 KB cada uno). Antes y después en
`previews/fachadas/9_interior_de_lejos_antes_despues.jpg`.

### Pendiente
- **Colisión adentro en Banham**: falta saber en qué punto exacto se topa.
- **Edificio completo**: los archivos de Strawberry ya están en el repo (`strawberry_gta/`) para reconstruirlo entero.

## Fachadas (v4)

Ahora cada tienda tiene su propia fachada "Tienda La Bendición", hecha a la medida de su edificio a partir de tus capturas.
Tapa todos los letreros 24/7, las franjas verdes, "SUPERMARKET", los murales pintados y los banners "DAIRY CANDY BEER".
Lleva revestimiento amarillo, molduras blancas y letreros que brillan de noche.

| Tienda | Qué se tapó | Vista previa |
|---|---|---|
| Strawberry | Letrero 24/7, "OPEN 24 HOURS" (desde la v3) | `previews/1_fachada_antes_despues.png` |
| Downtown Vinewood | Caja de luz 24/7 sobre la puerta, fachada de piedra revestida | `previews/fachadas/1_vinewood_antes_despues.jpg` |
| Tataviam (Palomino Fwy) | Franja verde larga, panel 24/7 grande y mural "24/7 SUPERMARKET" | `previews/fachadas/2_tataviam_antes_despues.jpg` |
| Banham Canyon | Los 2 letreros 24/7 del techo y los 2 banners verticales | `previews/fachadas/3_banham_canyon_antes_despues.jpg` |
| Chumash | Franja verde, letras "SUPERMARKET" del techo, logos de las esquinas y los 2 banners | `previews/fachadas/4_chumash_antes_despues.jpg` |
| Harmony (rehecha en v5) | Letrero 24/7 sobre el toldo, letrero "GROCERY", mural "MARKET", grafiti y franja roja. El espectacular de helado se queda (no es de la 24/7) | `previews/fachadas/5_harmony_antes_despues.jpg` |
| Sandy Shores | Letreros del edificio que trae el mapeo | `previews/fachadas/6_sandy_shores_geometria.jpg` |
| Grand Senora | Franja verde con OPEN DAY NIGHT, logo 24/7 y "SUPERMARKET", letrero "SELF SERVICE / COLD BEER" | `previews/fachadas/7_grand_senora_antes_despues.jpg` |
| Paleto Bay | Letrero 24/7 del techo, alero verde y los 3 pósters 24/7 de la pared | `previews/fachadas/8_paleto_bay_antes_despues.jpg` |

Cómo se hizo: la posición exacta de cada tienda sale de los objetos de su interior (error < 1 mm). Con cada captura se calculó la cámara
y se midió dónde está cada letrero viejo. Las vistas previas son una simulación de la fachada nueva proyectada sobre tu captura.
Una segunda pasada revisó cada tienda por separado: que el letrero viejo no se asome por delante desde ángulos de ±45 a 75°,
que nada choque con bancas, máquinas o postes, y que no haya parpadeo (caras encimadas).

Para revisar en el juego (desde una sola foto no se puede medir todo):
- **Vinewood**: el lado izquierdo de la fachada estaba tapado por tu personaje en la captura; puede quedar una franja de piedra.
- **Tataviam**: el extremo derecho de la franja no salía en la foto. La cubrí hasta 17 m, pero si la vieja sigue más allá, avísame.
- Las cajas que tapan los letreros viejos son más hondas de lo que parecen en la foto; así quedan tapados aunque el letrero viejo sobresalga más.

Rendimiento: cada fachada es un modelo de 1 a 8 KB con distancia de dibujado de 250 m. Las 9 comparten una sola textura (`bend_ext_txd.ytd`, 0.9 MB).

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
- **Otras 24/7 del mapa**: el interior nuevo sale en todas (comparten el mismo interior). La fachada nueva está en las 9.
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
  - Fachadas: `bend_ext_<tienda>.ydr/.ymap` (strawberry, hw1_02 Vinewood, ch3_03 Tataviam, ch1_11 Banham, ch1_12 Chumash,
    cs6_01 Harmony, cs4_10 Sandy, cs4_02 Grand Senora, cs2_11 Paleto), más `bend_ext.ytyp` y `bend_ext_txd.ytd`
  - Exterior de Sandy Shores: `cs4_10_247.ydr` + `lr_cs4_10_3.ybn`
- `previews/`: antes/después de la fachada (simulación proyectada sobre tu captura), interior y mapa caminable.
- `texturas_png/`: todas las texturas nuevas en PNG, por si quieres retocar colores o textos.

Pesa 5.7 MB en total. Todas las texturas llevan mipmaps, las que no usan transparencia van en DXT1, y los muebles y ventanas comparten una sola textura.
