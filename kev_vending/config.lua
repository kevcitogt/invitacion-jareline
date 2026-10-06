Config = {}

Config.Debug       = false
Config.DevCommands = true   -- /kvmodel (modelo del objeto que miras) y /kvcoords (tu posición). Apágalo en producción.

-- 'auto' detecta solo. Puedes forzar:
-- Framework: 'qbx' | 'qb' | 'esx' | 'standalone'
-- Inventory: 'ox_inventory' | 'qs-inventory' | 'codem-inventory' | 'tgiann-inventory' | 'origen_inventory'
--            | 'core_inventory' | 'ps-inventory' | 'lj-inventory' | 'qb-inventory' | 'framework'
-- Target:    'ox_target' | 'qb-target' | 'textui'
Config.Framework = 'auto'
Config.Inventory = 'auto'
Config.Target    = 'auto'

-- ================= NOTIFICACIONES =================
-- 'auto' | 'ox_lib' | 'qb' | 'esx' | 'okok' | 'mythic' | 'brutal' | 'lation' | 'native' | 'custom'
Config.Notify      = 'auto'
Config.NotifyTitle = 'Máquina'
Config.NotifyTime  = 5000
-- Solo se usa con Config.Notify = 'custom'. Corre en el CLIENTE.
-- type llega como: 'success' | 'error' | 'inform'
Config.CustomNotify = function(message, type, title)
    -- Ejemplo: exports['mi_notify']:Send(title, message, type, Config.NotifyTime)
    print(('[%s] %s'):format(type, message))
end

-- ================= DINERO =================
Config.CoinValue      = 1      -- cada moneda = Q1 (se descuenta del EFECTIVO)
Config.CurrencySymbol = 'Q'
Config.MaxCredit      = 20     -- monedas máximas que acepta una máquina

-- ================= GENERAL =================
Config.AutoClose         = true  -- al despachar, se quita la cámara sola y devuelve el cambio
Config.InteractDistance  = 1.6
Config.PickupDistance    = 1.8
Config.DropLifetime      = 300   -- segundos que dura el producto tirado/olvidado
Config.AllowOthersPickup = false -- true = otros jugadores pueden agarrar tu producto
Config.CoffeeBrewTime    = 6000  -- ms que tarda en servir el café

-- Humo/vapor del café (si tu build no lo tiene, simplemente no se ve)
Config.SteamFx = { asset = 'core', name = 'ent_amb_steam_vent_rnd', scale = 0.18 }

Config.Anims = {
    coin     = { 'mini@sprunk', 'plyr_buy_drink_pt1', 1700 },
    button   = { 'anim@apt_trans@buzzer', 'buzz_reg', 1200 },
    pickup   = { 'pickup_object', 'pickup_low', 1100 },
    grab     = { 'mp_common', 'givetake1_a', 1300 },            -- tomar el café de la bahía
    counter  = { 'anim@amb@business@coc@coc_unpack_cut_left@', 'coke_cut_v1_coccutter', -1 }, -- servirse en la barra
    hold     = { 'amb@world_human_drinking@coffee@male@idle_a', 'idle_c', 2500 },               -- sostener el vaso
}

-- ================= CÁMARA =================
-- Se calcula con el TAMAÑO REAL del modelo, así queda bien en cualquier máquina.
-- back = qué tan lejos del frente | side = hacia la derecha | height/look = % de la altura de la máquina
Config.Camera = {
    vending   = { back = 2.05, side = 0.80, height = 0.62, look = 0.52, lookSide = 0.12, fov = 50.0 },
    coffee    = { back = 2.05, side = 0.80, height = 0.62, look = 0.52, lookSide = 0.10, fov = 50.0 },
    dispenser = { back = 1.25, side = 0.35, height = 2.10, look = 0.45, lookSide = 0.00, fov = 48.0 },
    interp    = 900,
}

Config.Text = {
    use        = 'Usar máquina',
    pickup     = 'Recoger %s',
    take       = 'Tomar %s',
    not_yours  = 'Eso no es tuyo.',
    inv_full   = 'No tienes espacio en el inventario.',
    no_money   = 'No tienes suficiente efectivo.',
    picked     = 'Recogiste: %s',
    busy       = 'Alguien más está usando la máquina.',
    got_drink  = 'Te serviste: %s',
}

-- ================= CREADOR DE MÁQUINAS =================
-- /kvcreator abre el creador (solo admins). Todo lo que crees se guarda en data/creator.json
-- y se sincroniza al instante con todos los jugadores (no hace falta reiniciar).
Config.Creator = {
    enabled       = true,
    command       = 'kvcreator',
    ace           = 'kev_vending.admin',            -- add_ace group.admin kev_vending.admin allow
    groups        = { 'god', 'superadmin', 'admin' }, -- grupos del framework que pueden usarlo
    placeDistance = 12.0,                           -- distancia máxima para colocar un prop
    spawnDistance = 90.0,                           -- a qué distancia aparecen los props colocados
}

-- Imágenes del buscador de items.
-- 'auto' = usa las imágenes de tu inventario. O pon tu propia ruta, %s es el archivo (ej: water.png)
-- Ejemplo: Config.ItemImages = 'nui://mi_inventario/html/images/%s'
Config.ItemImages = 'auto'

-- Props sugeridos en el creador (puedes escribir cualquier otro modelo a mano)
Config.PropPresets = {
    { model = 'prop_vend_soda_01',    label = 'Vending roja (eCola)',       kind = 'vending' },
    { model = 'prop_vend_soda_02',    label = 'Vending verde (Sprunk)',     kind = 'vending' },
    { model = 'prop_vend_water_01',   label = 'Vending de agua (Raine)',    kind = 'vending' },
    { model = 'prop_vend_snak_01',    label = 'Vending de snacks',          kind = 'vending' },
    { model = 'prop_vend_fags_01',    label = 'Vending de cigarros',        kind = 'vending' },
    { model = 'prop_vend_coffe_01',   label = 'Café Bean Machine',          kind = 'coffee' },
    { model = 'prop_food_bs_soda_01', label = 'Fuente de sodas Burger Shot', kind = 'dispenser' },
    { model = 'prop_food_bs_soda_02', label = 'Fuente de sodas Burger Shot 2', kind = 'dispenser' },
    { model = 'prop_food_cb_soda_01', label = "Fuente de sodas Cluckin' Bell", kind = 'dispenser' },
    { model = 'prop_food_cb_soda_02', label = "Fuente de sodas Cluckin' Bell 2", kind = 'dispenser' },
    { model = 'prop_slush_dispenser', label = 'Granizadora',                kind = 'dispenser' },
    { model = 'prop_juice_dispenser', label = 'Dispensador de jugos',       kind = 'dispenser' },
}

-- Props que caen de la máquina (lo que recoges del suelo)
Config.DropPresets = {
    { prop = 'prop_ecola_can',      label = 'Lata eCola',          shape = 'can' },
    { prop = 'prop_ld_can_01',      label = 'Lata Sprunk',         shape = 'can' },
    { prop = 'prop_orang_can_01',   label = 'Lata Orang-O-Tang',   shape = 'can' },
    { prop = 'prop_energy_drink',   label = 'Bebida energética',   shape = 'can' },
    { prop = 'prop_ld_flow_bottle', label = 'Botella de agua',     shape = 'bottle' },
    { prop = 'prop_amb_beer_bottle', label = 'Botella de cerveza', shape = 'bottle' },
    { prop = 'prop_choc_ego',       label = 'Chocolate Ego Chaser', shape = 'snack' },
    { prop = 'prop_choc_meto',      label = 'Chocolate Meteorite', shape = 'snack' },
    { prop = 'prop_candy_pqs',      label = "Dulces P's & Q's",    shape = 'snack' },
    { prop = 'p_amb_coffeecup_01',  label = 'Vaso de café',        shape = 'cup' },
    { prop = 'ng_proc_sodacup_01a', label = 'Vaso de soda',        shape = 'cup' },
}

-- Si tu servidor es standalone (o el inventario no da la lista), el buscador usa estos items
Config.FallbackItems = {
    { name = 'water',       label = 'Agua' },
    { name = 'ecola',       label = 'eCola' },
    { name = 'ecola_light', label = 'eCola Light' },
    { name = 'sprunk',      label = 'Sprunk' },
    { name = 'sprunk_light', label = 'Sprunk Light' },
    { name = 'orangotang',  label = 'Orang-O-Tang' },
    { name = 'coffee',      label = 'Café' },
    { name = 'cappuccino',  label = 'Capuchino' },
    { name = 'hot_chocolate', label = 'Chocolate caliente' },
    { name = 'tea',         label = 'Té' },
    { name = 'egochaser',   label = 'Ego Chaser' },
    { name = 'meteorite',   label = 'Meteorite' },
    { name = 'pqs',         label = "P's & Q's" },
}

--[[ =====================================================================
  MÁQUINAS
  type:
    'vending'   -> monedas de Q1, botón, el producto CAE AL SUELO y se recoge
    'coffee'    -> monedas de Q1, eliges bebida y azúcar, el vaso cae en la bahía,
                   se sirve con vapor y lo tomas de la máquina
    'dispenser' -> fuente de sodas / slush / jugos: agarras un vaso (tamaño),
                   lo pones debajo, MANTIENES presionada la palanca para llenar,
                   hielo opcional, lo tapas y te lo llevas (se cobra del efectivo)
  models: nombres de props. Si tu máquina no reacciona, mírala y usa /kvmodel
          para ver su modelo y agrégalo aquí (acepta nombre o número hash).
  spot:   (x, z) posición de salida en % del ancho/alto de la máquina
  flip:   true si el personaje se para del lado de atrás (el prop viene al revés)
  logo:   estilo del letrero: 'script' | 'bold' | 'retro' | 'clean'
  shape:  (producto) cómo se dibuja en la vitrina: 'can' | 'bottle' | 'snack' | 'cup'
          si no lo pones se adivina por el prop.
  Tip: ya no hace falta tocar esto a mano, usa /kvcreator en el juego.
===================================================================== ]]
Config.Machines = {

    ecola = {
        type = 'vending', label = 'Máquina de bebidas',
        models = { 'prop_vend_soda_01' },
        brand = 'eCola', color = '#b3141c', logo = 'script',
        spot = vec2(-0.10, 0.22),
        products = {
            { item = 'ecola',       label = 'eCola',        price = 3, prop = 'prop_ecola_can',      color = '#c8102e' },
            { item = 'ecola_light', label = 'eCola Light',  price = 3, prop = 'prop_ecola_can',      color = '#d9d9d9' },
            { item = 'sprunk',      label = 'Sprunk',       price = 3, prop = 'prop_ld_can_01',      color = '#1f9e3a' },
            { item = 'orangotang',  label = 'Orang-O-Tang', price = 3, prop = 'prop_orang_can_01',   color = '#f08a00' },
            { item = 'water',       label = 'Agua Pura',    price = 2, prop = 'prop_ld_flow_bottle', color = '#3aa0ff' },
        },
    },

    sprunk = {
        type = 'vending', label = 'Máquina de bebidas',
        models = { 'prop_vend_soda_02' },
        brand = 'Sprunk', color = '#1b7f2e', logo = 'bold',
        spot = vec2(-0.10, 0.22),
        products = {
            { item = 'sprunk',       label = 'Sprunk',       price = 3, prop = 'prop_ld_can_01',      color = '#1f9e3a' },
            { item = 'sprunk_light', label = 'Sprunk Light', price = 3, prop = 'prop_ld_can_01',      color = '#b8e986' },
            { item = 'ecola',        label = 'eCola',        price = 3, prop = 'prop_ecola_can',      color = '#c8102e' },
            { item = 'orangotang',   label = 'Orang-O-Tang', price = 3, prop = 'prop_orang_can_01',   color = '#f08a00' },
            { item = 'water',        label = 'Agua Pura',    price = 2, prop = 'prop_ld_flow_bottle', color = '#3aa0ff' },
        },
    },

    agua = {
        type = 'vending', label = 'Máquina de agua',
        models = { 'prop_vend_water_01' },
        brand = 'Raine', color = '#1d6fb8', logo = 'clean',
        spot = vec2(0.0, 0.22),
        products = {
            { item = 'water', label = 'Agua Pura', price = 2, prop = 'prop_ld_flow_bottle', color = '#3aa0ff' },
        },
    },

    snacks = {
        type = 'vending', label = 'Máquina de snacks',
        models = { 'prop_vend_snak_01', 'prop_vend_snak_01_tu' },
        brand = 'Snacks', color = '#6b2a86', logo = 'retro',
        spot = vec2(0.0, 0.18),
        products = {
            { item = 'egochaser', label = 'Ego Chaser',  price = 4, prop = 'prop_choc_ego',  color = '#ffb400' },
            { item = 'meteorite', label = 'Meteorite',   price = 4, prop = 'prop_choc_meto', color = '#7a3b1d' },
            { item = 'pqs',       label = "P's & Q's",   price = 3, prop = 'prop_candy_pqs', color = '#e04ba0' },
        },
    },

    cafe = {
        type = 'coffee', label = 'Máquina de café',
        models = { 'prop_vend_coffe_01', 'prop_vend_coffe_01_tu' },
        brand = 'Bean Machine', color = '#6b4226', logo = 'clean',
        spot = vec2(0.0, 0.40),          -- la bahía donde cae el vaso
        cupProp = 'p_amb_coffeecup_01',
        sugar = true,                    -- botones de azúcar (0 a 5)
        products = {
            { item = 'coffee',        label = 'Café Negro',     price = 3, color = '#3b2314' },
            { item = 'coffee_milk',   label = 'Café con Leche', price = 4, color = '#b07a4a' },
            { item = 'cappuccino',    label = 'Capuchino',      price = 5, color = '#d8b48a' },
            { item = 'hot_chocolate', label = 'Chocolate',      price = 4, color = '#5a2d0c' },
            { item = 'tea',           label = 'Té Caliente',    price = 3, color = '#a0522d' },
        },
    },

    -- Fuente de sodas (la roja de la 3ra imagen)
    fuente = {
        type = 'dispenser', style = 'fountain', label = 'Fuente de sodas',
        models = { 'prop_food_bs_soda_01', 'prop_food_bs_soda_02', 'prop_food_cb_soda_01', 'prop_food_cb_soda_02' },
        brand = 'eCola', color = '#c8102e', logo = 'script',
        cupProp = 'ng_proc_sodacup_01a',
        mixItem = nil,  -- item si mezclan sabores (nil = se da el sabor que más lleva)
        cups = {
            { label = 'Chico',   price = 2, ml = 350 },
            { label = 'Mediano', price = 3, ml = 500 },
            { label = 'Grande',  price = 4, ml = 750 },
        },
        taps = {
            { label = 'Sprunk',       item = 'sprunk',       color = '#1f9e3a' },
            { label = 'eCola Light',  item = 'ecola_light',  color = '#b9b0a6' },
            { label = 'HIELO',        ice = true,            color = '#cfeeff' },
            { label = 'Orang-O-Tang', item = 'orangotang',   color = '#f08a00' },
            { label = 'eCola',        item = 'ecola',        color = '#5a1a0e' },
        },
    },

    -- Granizadas / slush (la verde y azul de la 3ra imagen)
    slush = {
        type = 'dispenser', style = 'slush', label = 'Granizadas',
        models = { 'prop_slush_dispenser' },
        brand = 'Sludgie', color = '#1d6fb8', logo = 'retro',
        cupProp = 'ng_proc_sodacup_01a',
        cups = {
            { label = 'Chico',  price = 3, ml = 350 },
            { label = 'Grande', price = 5, ml = 650 },
        },
        taps = {
            { label = 'Lima-Limón', item = 'slush_green', color = '#3fd07a' },
            { label = 'Mora Azul',  item = 'slush_blue',  color = '#2f8cff' },
        },
    },

    -- Jugos (la de naranja y fresa de la 3ra imagen)
    jugos = {
        type = 'dispenser', style = 'juice', label = 'Jugos',
        models = { 'prop_juice_dispenser' },
        brand = 'Fresco', color = '#e0762b', logo = 'bold',
        cupProp = 'ng_proc_sodacup_01a',
        cups = {
            { label = 'Chico',  price = 2, ml = 350 },
            { label = 'Grande', price = 4, ml = 650 },
        },
        taps = {
            { label = 'Naranja', item = 'juice_orange',     color = '#ffb319' },
            { label = 'Fresa',   item = 'juice_strawberry', color = '#ff7a52' },
        },
    },
}

--[[ =====================================================================
  UBICACIONES FIJAS (para máquinas que son parte del mapa/MLO y no son objetos,
  por ejemplo la fuente de sodas de algunas tiendas 24/7).
  1) Párate enfrente de la máquina mirándola.
  2) Escribe /kvcoords  -> te copia el vec4.
  3) Pégalo aquí:
===================================================================== ]]
Config.Locations = {
    -- { machine = 'fuente', stand = vec4(25.74, -1345.35, 29.50, 270.0), counter = 0.92 },
    -- { machine = 'slush',  stand = vec4(0.0, 0.0, 0.0, 0.0), counter = 0.92 },
}
