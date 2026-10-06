# kev_vending v3: Creador de máquinas de bebidas (FiveM)

Funciona en **QBCore, Qbox, ESX y standalone**, con casi cualquier inventario, target y sistema de notificaciones (todo se detecta solo).

## Novedades de la v3
- **Creador de máquinas en el juego** (`/kvcreator`, solo admins): crea máquinas nuevas o edita las de `config.lua` sin reiniciar el servidor.
  - Eliges el tipo (Vending, Café, Fuente de sodas, Granizadas, Jugos), la marca, el color, el estilo del letrero y los productos.
  - **Vista previa en vivo** de cómo se verá la máquina.
  - **Colocar en el mundo**: aparece un prop "fantasma" donde miras. Lo giras con la rueda del mouse, lo subes o bajas con las flechas y lo colocas con **E**.
  - **Usar una máquina del mapa**: para las que son parte del edificio (MLO) y no son objetos. Te paras enfrente y presionas **E**.
  - **Todas las del mapa**: si agregas un modelo (ej. `prop_vend_soda_01`), todas las máquinas de ese modelo usan tu configuración.
  - Se guarda en `data/creator.json` y se sincroniza al instante con todos los jugadores.
- **Buscador de items**: lee la lista de items de tu inventario (ox_inventory, qb/ps/lj-inventory, qs, codem, tgiann, origen, ESX…) **con sus imágenes**. Busca por nombre o label, filtra por Bebidas, Comida o Usados, y se navega con el teclado. Al elegir un item se pone solo el nombre y el color se saca de la imagen.
- **Rediseño completo de las máquinas**:
  - **Vending**: vitrina con latas, botellas o snacks dibujados, espirales que giran, códigos A1/B2 con **teclado**, el producto **cae a la bahía**, LCD de matriz de puntos y monedero de cuero.
  - **Café**: menú con tarjetas, cubos de azúcar, botón **PREPARAR** con anillo de progreso, y el vaso cae, **se llena con el color de la bebida**, con vapor y espuma.
  - **Fuente / Granizadas / Jugos**: tanques con burbujas, grifos iluminados, palancas cromadas y una **línea de llenado**. Al tapar el vaso te califica: **¡PERFECTO!**, Bien servido, Le faltó o ¡Rebalsado!
  - Letreros con 4 estilos (`script`, `bold`, `retro`, `clean`) y texto 3D con el color de la marca.

## Máquinas incluidas en config.lua
| Máquina | Prop | Cómo funciona |
|---|---|---|
| eCola (roja) | `prop_vend_soda_01` | Monedas de Q1, código o clic en la lata. La lata **cae al suelo** y la recoges con `[E] Recoger` |
| Sprunk (verde) | `prop_vend_soda_02` | Igual que la de eCola |
| Agua / Snacks | `prop_vend_water_01`, `prop_vend_snak_01` | Igual |
| **Bean Machine (café)** | `prop_vend_coffe_01` | Monedas, eliges bebida y **azúcar**, presionas PREPARAR y lo tomas con `[E] Tomar` |
| **Fuente de sodas** | `prop_food_bs_soda_01/02`, `prop_food_cb_soda_01/02` | Agarras vaso, **mantienes la palanca**, hielo opcional, si te pasas **se rebalsa** |
| **Granizadas (slush)** | `prop_slush_dispenser` | Igual, bebida espesa (llena más lento) |
| **Jugos** | `prop_juice_dispenser` | Igual, con botón PUSH |

## Instalación
1. Copia `kev_vending` a `resources/`.
2. En `server.cfg`, después de tu framework, inventario, target y ox_lib:
   ```
   ensure kev_vending
   ```
3. **Quita el script de máquinas que tenías antes** para que no salgan dos opciones.
4. Crea los items (abajo) o elígelos desde el creador con el buscador.
5. Necesita **OneSync** para que las latas y vasos se vean y se borren bien para todos.

## Creador de máquinas
**Permisos.** Puede usarlo quien tenga cualquiera de estos:
- el ace `kev_vending.admin`: `add_ace group.admin kev_vending.admin allow`
- el ace `command` (lo normal para admins)
- un grupo de `Config.Creator.groups` (`god`, `superadmin`, `admin`) en QBCore, Qbox o ESX

**Uso rápido:**
1. Escribe **`/kvcreator`**.
2. **Nueva máquina** y eliges el tipo.
3. En **General** pones marca, color y estilo del letrero.
4. En **Productos** (o **Grifos y vasos**) presionas *Agregar desde el buscador de items* y eliges el precio.
5. **Guardar** (o `Ctrl+S`).
6. En **Colocación** eliges *Colocar prop en el mundo* y la colocas con **E**.

**Controles al colocar:**
| Tecla | Acción |
|---|---|
| Rueda del mouse / ← → | Girar (con **Shift**, giro fino) |
| ↑ / ↓ | Subir o bajar |
| G | Pegar al piso |
| R | Que mire hacia ti |
| E / clic izquierdo | Colocar |
| Backspace / clic derecho | Cancelar |

El cuadro amarillo del piso marca **dónde se para el jugador**. Si queda detrás, activa *Prop al revés* en General.

**Detalles:**
- Las máquinas de `config.lua` se pueden editar. Los cambios se guardan aparte y con **Restablecer** vuelven a como estaban.
- **Desactivar** una máquina la quita del juego sin borrarla.
- Si una máquina creada usa un modelo que ya tenía otra, gana la creada en el juego.
- Al actualizar el script, **no reemplaces `data/creator.json`** o perderás tus máquinas. Haz copia de ese archivo.

## Buscador de items
Las imágenes se toman solas de tu inventario. Si usas otro, pon la ruta en `config.lua`:
```lua
Config.ItemImages = 'nui://mi_inventario/html/images/%s'
```
Si el inventario no da la lista (standalone), se usan `Config.FallbackItems`. Si un item no aparece, escribe su nombre exacto abajo del buscador.

## Si una máquina no reacciona
**1. Es un objeto con otro modelo.** Míralo de cerca y escribe **`/kvmodel`** para ver su nombre o hash. Agrégalo en el creador (Colocación → *Todas las del mapa con este modelo*) o en `models = { ... }` de `config.lua`.

**2. Es parte del mapa (MLO).** `/kvmodel` dice "No estás mirando un objeto". Usa el creador: Colocación → **Usar una máquina del mapa**, te paras enfrente y presionas **E**. También sigue funcionando `Config.Locations` con `/kvcoords`.

Apaga `Config.DevCommands` cuando termines de configurar.

## Items de ejemplo

**ox_inventory** (`ox_inventory/data/items.lua`):
```lua
-- frías
['ecola']        = { label = 'eCola',        weight = 350, client = { status = { thirst = 200000 }, anim = 'drinking', prop = 'drink', usetime = 2500 } },
['ecola_light']  = { label = 'eCola Light',  weight = 350, client = { status = { thirst = 200000 }, anim = 'drinking', prop = 'drink', usetime = 2500 } },
['sprunk']       = { label = 'Sprunk',       weight = 350, client = { status = { thirst = 200000 }, anim = 'drinking', prop = 'drink', usetime = 2500 } },
['sprunk_light'] = { label = 'Sprunk Light', weight = 350, client = { status = { thirst = 200000 }, anim = 'drinking', prop = 'drink', usetime = 2500 } },
['orangotang']   = { label = 'Orang-O-Tang', weight = 350, client = { status = { thirst = 200000 }, anim = 'drinking', prop = 'drink', usetime = 2500 } },
['slush_green']  = { label = 'Granizada Lima-Limón', weight = 400, client = { status = { thirst = 250000 }, anim = 'drinking', prop = 'drink', usetime = 3000 } },
['slush_blue']   = { label = 'Granizada Mora Azul',  weight = 400, client = { status = { thirst = 250000 }, anim = 'drinking', prop = 'drink', usetime = 3000 } },
['juice_orange']     = { label = 'Jugo de Naranja', weight = 400, client = { status = { thirst = 250000 }, anim = 'drinking', prop = 'drink', usetime = 2500 } },
['juice_strawberry'] = { label = 'Jugo de Fresa',   weight = 400, client = { status = { thirst = 250000 }, anim = 'drinking', prop = 'drink', usetime = 2500 } },
-- calientes
['coffee']        = { label = 'Café Negro',     weight = 300, client = { status = { thirst = 150000 }, anim = 'drinking', prop = 'drink', usetime = 3000 } },
['coffee_milk']   = { label = 'Café con Leche', weight = 300, client = { status = { thirst = 150000 }, anim = 'drinking', prop = 'drink', usetime = 3000 } },
['cappuccino']    = { label = 'Capuchino',      weight = 300, client = { status = { thirst = 150000 }, anim = 'drinking', prop = 'drink', usetime = 3000 } },
['hot_chocolate'] = { label = 'Chocolate',      weight = 300, client = { status = { thirst = 150000 }, anim = 'drinking', prop = 'drink', usetime = 3000 } },
['tea']           = { label = 'Té Caliente',    weight = 300, client = { status = { thirst = 150000 }, anim = 'drinking', prop = 'drink', usetime = 3000 } },
-- snacks
['egochaser'] = { label = 'Ego Chaser', weight = 100, client = { status = { hunger = 150000 }, anim = 'eating', prop = 'burger', usetime = 2500 } },
['meteorite'] = { label = 'Meteorite',  weight = 100, client = { status = { hunger = 150000 }, anim = 'eating', prop = 'burger', usetime = 2500 } },
['pqs']       = { label = "P's & Q's",  weight = 100, client = { status = { hunger = 100000 }, anim = 'eating', prop = 'burger', usetime = 2500 } },
-- 'water' ya viene en ox_inventory
```

**QBCore / qb-inventory / ps-inventory** (`qb-core/shared/items.lua`), un ejemplo; repite para los demás:
```lua
ecola = { name = 'ecola', label = 'eCola', weight = 350, type = 'item', image = 'ecola.png', unique = false, useable = true, shouldClose = true, description = 'Refresco' },
```
Para que se puedan tomar, agrégalos a tu script de consumibles como cualquier bebida.

**ESX sin ox_inventory:** agrégalos a la tabla `items` de la base de datos.

## Notificación personalizada
```lua
Config.Notify = 'custom'
Config.CustomNotify = function(message, type, title)
    exports['mi_notify']:Send(title, message, type, Config.NotifyTime)
end
```
`type` llega como `success`, `error` o `inform`.

## Abrir el creador desde otro script
```lua
exports.kev_vending:OpenCreator()          -- cliente
TriggerEvent('kev_vending:openCreator')   -- cliente
```
El servidor siempre revisa los permisos.

## Probar la interfaz sin entrar al juego
Abre `html/index.html` en Chrome y agrega `?m=` para cada pantalla:
`?m=ecola`, `?m=sprunk`, `?m=snacks`, `?m=cafe`, `?m=fuente`, `?m=slush`, `?m=jugos` y **`?m=creator`** (el creador con datos de ejemplo).

## Moneda de Q1
Es una recreación en SVG con relieve metálico. Si quieres que sea idéntica a la real, pon fotos recortadas en `html/img/q1_anverso.png` y `q1_reverso.png`, descomenta la línea de img en `fxmanifest.lua` y cambia `COIN_IMAGES` en `html/app.js`.

## Seguridad
- Todo el dinero y los items se manejan en el servidor.
- Se valida la distancia, el crédito, el dueño del producto y el precio del vaso.
- Hay límite de velocidad al meter monedas y al comprar.
- Si el jugador se desconecta con crédito, se le devuelve.
- El creador revisa los permisos en **cada** acción. Además limpia y limita todo lo que recibe (IDs, textos, colores, precios hasta `Config.MaxCredit`, nombres de items y modelos) y no deja colocar máquinas lejos de donde está el admin.
