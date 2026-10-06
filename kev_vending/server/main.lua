-- ==========================================================
--  kev_vending - servidor (todo el dinero y los items van aquí)
-- ==========================================================
local sessions = {}   -- [src] = { id, cfg, coords, credit, last }
local drops    = {}   -- [id]  = { owner, item, label, prop, netId, coords, created, meta, mode }
local dropSeq  = 0

-- ==========================================================
--  REGISTRO DE MÁQUINAS (config.lua + lo creado en el juego)
-- ==========================================================
local RES        = GetCurrentResourceName()
local STORE_FILE = 'data/creator.json'
local Store      = { machines = {}, placements = {}, seq = 0 }
local All        = {}   -- todas (incluye desactivadas) -> para el creador
Machines         = {}   -- solo las activas -> lo que usan los jugadores

-- vec2/vec3 -> tablas normales (para JSON y la NUI)
local function plain(v)
    local t = type(v)
    if t == 'vector2' then return { x = v.x, y = v.y } end
    if t == 'vector3' then return { x = v.x, y = v.y, z = v.z } end
    if t == 'vector4' then return { x = v.x, y = v.y, z = v.z, w = v.w } end
    if t == 'table' then
        local o = {}
        for k, x in pairs(v) do o[k] = plain(x) end
        return o
    end
    if t == 'function' then return nil end
    return v
end

local function loadStore()
    local raw = LoadResourceFile(RES, STORE_FILE)
    if not raw or raw == '' then return end
    local ok, data = pcall(json.decode, raw)
    if not ok or type(data) ~= 'table' then
        print('^1[kev_vending] data/creator.json está dañado, se ignora.^7')
        return
    end
    Store.machines   = type(data.machines) == 'table' and data.machines or {}
    Store.placements = type(data.placements) == 'table' and data.placements or {}
    Store.seq        = tonumber(data.seq) or 0
    for _, pl in ipairs(Store.placements) do
        if (tonumber(pl.id) or 0) > Store.seq then Store.seq = tonumber(pl.id) end
    end
end

local function saveStore()
    local ok = SaveResourceFile(RES, STORE_FILE, json.encode(Store, { indent = true }), -1)
    if not ok then print('^1[kev_vending] No se pudo guardar data/creator.json (¿permisos de escritura?)^7') end
end

local RANK = { config = 1, override = 2, custom = 3 }

local function rebuild()
    local all = {}
    for id, m in pairs(Config.Machines) do
        all[id] = plain(m)
        all[id].origin = 'config'
    end
    for id, m in pairs(Store.machines) do
        local copy = plain(m)
        copy.origin = all[id] and 'override' or 'custom'
        all[id] = copy
    end
    All = all

    -- solo activas + cada modelo pertenece a una sola máquina (gana lo creado en el juego)
    local active, ids = {}, {}
    for id, m in pairs(all) do
        if m.enabled ~= false then active[id] = plain(m) ids[#ids + 1] = id end
    end
    table.sort(ids, function(a, b)
        local ra, rb = RANK[active[a].origin] or 1, RANK[active[b].origin] or 1
        if ra ~= rb then return ra < rb end
        return a < b
    end)
    local owner = {}
    for _, id in ipairs(ids) do
        for _, mdl in ipairs(active[id].models or {}) do
            owner[type(mdl) == 'number' and mdl or GetHashKey(mdl)] = id
        end
    end
    for _, id in ipairs(ids) do
        local keep = {}
        for _, mdl in ipairs(active[id].models or {}) do
            if owner[type(mdl) == 'number' and mdl or GetHashKey(mdl)] == id then keep[#keep + 1] = mdl end
        end
        active[id].models = keep
    end
    Machines = active
end

local function syncPayload() return { machines = Machines, placements = Store.placements } end
local function broadcast() TriggerClientEvent('kev_vending:sync', -1, syncPayload()) end

loadStore()
rebuild()

-- ---------- mini sistema de callbacks ----------
local handlers = {}
local function RegisterCallback(name, fn) handlers[name] = fn end

RegisterNetEvent('kev_vending:cb:req', function(name, id, ...)
    local src = source
    local h = handlers[name]
    if not h then return end
    local ok, res = pcall(h, src, ...)
    if not ok then print('^1[kev_vending] error en ' .. name .. ': ' .. tostring(res) .. '^7') res = nil end
    TriggerClientEvent('kev_vending:cb:res', src, id, res)
end)

local function pedCoords(src) return GetEntityCoords(GetPlayerPed(src)) end
local function coinsOf(src) return math.floor((Bridge.GetCash(src) or 0) / Config.CoinValue) end

local function refund(src)
    local s = sessions[src]
    if not s or s.credit <= 0 then return 0 end
    local amount = s.credit
    s.credit = 0
    Bridge.AddCash(src, amount * Config.CoinValue)
    return amount
end

local function near(src, coords, dist) return #(pedCoords(src) - coords) <= (dist or 4.0) end

-- ---------- abrir ----------
RegisterCallback('sync', function() return syncPayload() end)

RegisterCallback('open', function(src, machineId, coords)
    local cfg = Machines[machineId]
    if not cfg or type(coords) ~= 'vector3' then return { ok = false } end
    if not near(src, coords, 4.5) then return { ok = false } end

    for other, s in pairs(sessions) do
        if other ~= src and #(s.coords - coords) < 0.5 then return { ok = false, reason = 'busy' } end
    end

    refund(src)
    sessions[src] = { id = machineId, cfg = cfg, coords = coords, credit = 0, last = 0 }
    return { ok = true, coins = coinsOf(src), cash = Bridge.GetCash(src) }
end)

-- ---------- meter moneda (vending / coffee) ----------
RegisterCallback('insertCoin', function(src)
    local s = sessions[src]
    if not s or s.cfg.type == 'dispenser' then return { ok = false } end

    local now = GetGameTimer()
    if now - s.last < 350 then return { ok = false, reason = 'fast', credit = s.credit } end
    s.last = now

    if s.credit >= Config.MaxCredit then
        return { ok = false, reason = 'full', credit = s.credit, coins = coinsOf(src) }
    end
    if not Bridge.RemoveCash(src, Config.CoinValue) then
        return { ok = false, reason = 'nomoney', credit = s.credit, coins = coinsOf(src) }
    end
    s.credit = s.credit + 1
    return { ok = true, credit = s.credit, coins = coinsOf(src) }
end)

-- ---------- presionar botón (vending / coffee) ----------
local SUGAR = { [0] = 'Sin azúcar', 'Poca azúcar', 'Azúcar normal', 'Dulce', 'Muy dulce', 'Extra dulce' }

RegisterCallback('buy', function(src, index, sugar)
    local s = sessions[src]
    if not s or s.cfg.type == 'dispenser' or s.busy then return { ok = false } end
    local p = s.cfg.products[tonumber(index) or 0]
    if not p then return { ok = false } end
    if not near(src, s.coords) then return { ok = false } end
    local now = GetGameTimer()
    if s.lastBuy and now - s.lastBuy < 1500 then return { ok = false, reason = 'fast', credit = s.credit } end

    if s.credit < p.price then
        return { ok = false, reason = 'credit', credit = s.credit, price = p.price }
    end

    s.credit = s.credit - p.price
    s.lastBuy = now
    dropSeq = dropSeq + 1

    local meta, mode, prop = nil, 'floor', p.prop
    if s.cfg.type == 'coffee' then
        mode, prop = 'bay', s.cfg.cupProp or 'p_amb_coffeecup_01'
        if s.cfg.sugar then
            sugar = math.max(0, math.min(5, math.floor(tonumber(sugar) or 2)))
            meta = { sugar = sugar, description = ('%s · %s · Caliente'):format(p.label, SUGAR[sugar]) }
        end
    end

    drops[dropSeq] = {
        owner = src, item = p.item, label = p.label, prop = prop, mode = mode, meta = meta,
        coords = s.coords, created = os.time(), netId = nil,
    }
    return { ok = true, credit = s.credit, dropId = dropSeq, prop = prop, label = p.label, mode = mode }
end)

-- ---------- el cliente avisa el netId del objeto ----------
RegisterCallback('registerDrop', function(src, id, netId)
    local d = drops[id]
    if not d or d.owner ~= src or d.netId then return false end
    netId = tonumber(netId)
    if not netId then return false end
    -- seguridad: solo se acepta un objeto real, creado por este jugador y junto a la maquina
    local ent = 0
    for _ = 1, 20 do
        ent = NetworkGetEntityFromNetworkId(netId)
        if ent ~= 0 then break end
        Wait(100)
    end
    if ent == 0 or not DoesEntityExist(ent) or GetEntityType(ent) ~= 3
        or NetworkGetEntityOwner(ent) ~= src or #(GetEntityCoords(ent) - d.coords) > 8.0 then
        return false
    end
    d.netId = netId
    TriggerClientEvent('kev_vending:dropAdded', -1, id, { netId = netId, label = d.label, owner = d.owner, mode = d.mode })
    return true
end)

-- ---------- devolver / cerrar ----------
RegisterCallback('refund', function(src)
    local n = refund(src)
    return { ok = true, refunded = n, coins = coinsOf(src) }
end)

RegisterCallback('close', function(src)
    local n = refund(src)
    sessions[src] = nil
    return { ok = true, refunded = n }
end)

-- ---------- fuente de sodas / slush / jugos ----------
RegisterCallback('finishCup', function(src, data)
    local s = sessions[src]
    if not s or s.cfg.type ~= 'dispenser' or type(data) ~= 'table' then return { ok = false } end
    if not near(src, s.coords) then return { ok = false } end
    local cfg = s.cfg
    local cup = cfg.cups[tonumber(data.size) or 0]
    if not cup then return { ok = false } end

    local total, best, bestAmt = 0, nil, 0
    local flavors = type(data.flavors) == 'table' and data.flavors or {}
    for i, tap in ipairs(cfg.taps) do
        if not tap.ice then
            local a = math.max(0, math.min(100, tonumber(flavors[i]) or 0))
            total = total + a
            if a > bestAmt then best, bestAmt = tap, a end
        end
    end
    if not best or total < 15 then return { ok = false, reason = 'empty' } end

    local price = cup.price * Config.CoinValue
    if not Bridge.RemoveCash(src, price) then return { ok = false, reason = 'nomoney' } end

    local mixed = (bestAmt / total) < 0.8
    local ice = (tonumber(data.ice) or 0) > 5
    local fill = math.floor(math.min(100, tonumber(data.level) or total))
    local label = mixed and 'Mezcla' or best.label
    local meta = {
        size = cup.label, ml = cup.ml, fill = fill, ice = ice,
        description = ('%s %s (%dml) · %s · %d%% lleno'):format(label, cup.label, cup.ml, ice and 'con hielo' or 'sin hielo', fill),
    }
    local item = (mixed and cfg.mixItem) or best.item

    if not Bridge.AddItem(src, item, 1, meta) then
        Bridge.AddCash(src, price)
        return { ok = false, reason = 'full' }
    end
    sessions[src] = nil
    return { ok = true, label = label, size = cup.label, prop = cfg.cupProp }
end)

-- ---------- recoger ----------
local function removeDrop(id)
    local d = drops[id]
    if not d then return end
    drops[id] = nil
    if d.netId then
        local ent = NetworkGetEntityFromNetworkId(d.netId)
        if ent and ent ~= 0 and DoesEntityExist(ent) then DeleteEntity(ent) end
        TriggerClientEvent('kev_vending:dropRemoved', -1, id, d.netId)
    end
end

RegisterCallback('pickup', function(src, id)
    local d = drops[id]
    if not d or not d.netId then return { ok = false } end
    if not Config.AllowOthersPickup and d.owner ~= src then return { ok = false, reason = 'not_yours' } end

    local pos = d.coords
    local ent = NetworkGetEntityFromNetworkId(d.netId)
    if ent and ent ~= 0 and DoesEntityExist(ent) then pos = GetEntityCoords(ent) end
    if #(pedCoords(src) - pos) > Config.PickupDistance + 1.5 then return { ok = false } end

    if d.busy then return { ok = false } end
    d.busy = true
    if not Bridge.AddItem(src, d.item, 1, d.meta) then
        d.busy = false
        return { ok = false, reason = 'full' }
    end
    local label, mode = d.label, d.mode
    removeDrop(id)
    return { ok = true, label = label, mode = mode }
end)

RegisterCallback('getDrops', function()
    local list = {}
    for id, d in pairs(drops) do
        if d.netId then list[#list + 1] = { id = id, netId = d.netId, label = d.label, owner = d.owner, mode = d.mode } end
    end
    return list
end)

-- ---------- limpieza ----------
CreateThread(function()
    while true do
        Wait(15000)
        local now = os.time()
        for id, d in pairs(drops) do
            if now - d.created > Config.DropLifetime then removeDrop(id) end
        end
    end
end)

AddEventHandler('playerDropped', function()
    local src = source
    pcall(refund, src)
    sessions[src] = nil
end)

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    for src in pairs(sessions) do pcall(refund, src) end
    for id in pairs(drops) do removeDrop(id) end
end)

-- ==========================================================
--  CREADOR DE MÁQUINAS (solo admins)
-- ==========================================================
local TYPES  = { vending = true, coffee = true, dispenser = true }
local STYLES = { fountain = true, slush = true, juice = true }
local LOGOS  = { script = true, bold = true, retro = true, clean = true }
local SHAPES = { can = true, bottle = true, snack = true, cup = true }

local function clean(v, max, def)
    if type(v) ~= 'string' then return def end
    v = v:gsub('[%c<>]', ''):gsub('^%s+', ''):gsub('%s+$', '')
    if v == '' then return def end
    local n = utf8.len(v)
    if n and n > max then v = v:sub(1, utf8.offset(v, max + 1) - 1) elseif not n then v = v:sub(1, max) end
    return v
end
local function num(v, min, max, def)
    v = tonumber(v)
    if not v or v ~= v then return def end
    return math.max(min, math.min(max, v))
end
local function int(v, min, max, def) return math.floor(num(v, min, max, def) + 0.5) end
local function color(v, def)
    if type(v) == 'string' and v:match('^#%x%x%x%x%x%x$') then return v:lower() end
    return def
end
local function itemName(v)
    if type(v) == 'string' and #v <= 64 and v:match('^[%w_%-%.:]+$') then return v end
end
local function model(v)
    if type(v) == 'number' then return math.floor(v) end
    if type(v) == 'string' then
        local n = tonumber(v)
        if n then return math.floor(n) end
        if #v <= 64 and v:match('^[%w_%-]+$') then return v:lower() end
    end
end
local function normId(v)
    if type(v) ~= 'string' then return nil end
    v = v:lower():gsub('[^%w_]', '_'):gsub('_+', '_'):gsub('^_', ''):gsub('_$', '')
    v = v:sub(1, 32)
    if v == '' or not v:match('^%a') then return nil end
    return v
end

local function sanitizeMachine(d)
    if type(d) ~= 'table' then return nil, 'data' end
    local m = {}
    m.type    = TYPES[d.type] and d.type or 'vending'
    m.label   = clean(d.label, 40, 'Máquina')
    m.brand   = clean(d.brand, 24, '')
    m.color   = color(d.color, '#b3141c')
    m.logo    = LOGOS[d.logo] and d.logo or 'script'
    m.enabled = d.enabled ~= false
    m.flip    = d.flip == true

    m.models = {}
    if type(d.models) == 'table' then
        for _, x in ipairs(d.models) do
            local mm = model(x)
            if mm and #m.models < 12 then m.models[#m.models + 1] = mm end
        end
    end
    m.prop = model(d.prop) or m.models[1]

    local sp = type(d.spot) == 'table' and d.spot or {}
    local defX = m.type == 'vending' and -0.10 or 0.0
    local defY = m.type == 'coffee' and 0.40 or 0.22
    m.spot = { x = num(sp.x, -0.5, 0.5, defX), y = num(sp.y, 0.0, 1.0, defY) }

    if m.type == 'dispenser' then
        m.style   = STYLES[d.style] and d.style or 'fountain'
        m.cupProp = model(d.cupProp) or 'ng_proc_sodacup_01a'
        m.mixItem = itemName(d.mixItem)
        m.cups, m.taps = {}, {}
        for i, c in ipairs(type(d.cups) == 'table' and d.cups or {}) do
            if i > 4 then break end
            if type(c) == 'table' then
                m.cups[#m.cups + 1] = { label = clean(c.label, 16, 'Vaso'), price = int(c.price, 1, 100000, 2), ml = int(c.ml, 100, 2000, 500) }
            end
        end
        local liquids = 0
        for i, t in ipairs(type(d.taps) == 'table' and d.taps or {}) do
            if i > 8 then break end
            if type(t) == 'table' then
                if t.ice == true then
                    m.taps[#m.taps + 1] = { label = clean(t.label, 16, 'HIELO'), ice = true, color = color(t.color, '#cfeeff') }
                else
                    local it = itemName(t.item)
                    if it then
                        liquids = liquids + 1
                        m.taps[#m.taps + 1] = { label = clean(t.label, 20, it), item = it, color = color(t.color, '#c8102e') }
                    end
                end
            end
        end
        if #m.cups == 0 then return nil, 'no_cups' end
        if liquids == 0 then return nil, 'no_taps' end
    else
        if m.type == 'coffee' then
            m.sugar   = d.sugar ~= false
            m.cupProp = model(d.cupProp) or 'p_amb_coffeecup_01'
        end
        m.products = {}
        for i, p in ipairs(type(d.products) == 'table' and d.products or {}) do
            if i > 16 then break end
            local it = type(p) == 'table' and itemName(p.item)
            if it then
                m.products[#m.products + 1] = {
                    item  = it,
                    label = clean(p.label, 20, it),
                    price = int(p.price, 1, Config.MaxCredit, 1),
                    color = color(p.color, '#888888'),
                    prop  = m.type == 'vending' and (model(p.prop) or 'prop_ecola_can') or nil,
                    shape = SHAPES[p.shape] and p.shape or nil,
                }
            end
        end
        if #m.products == 0 then return nil, 'no_products' end
    end
    return m
end

local function creatorData()
    local list = {}
    for id, m in pairs(All) do
        local c = plain(m)
        c.id = id
        list[#list + 1] = c
    end
    table.sort(list, function(a, b) return a.id < b.id end)
    return list
end

local function isAdmin(src)
    if not (Config.Creator and Config.Creator.enabled) then return false end
    return Bridge.IsAdmin(src)
end

local function log(src, msg)
    print(('^5[kev_vending]^7 %s (%s) %s'):format(GetPlayerName(src) or '?', src, msg))
end

RegisterCallback('creatorOpen', function(src)
    if not isAdmin(src) then return { ok = false, reason = 'perm' } end
    local fw, inv = Bridge.Info()
    return {
        ok = true,
        machines = creatorData(),
        placements = Store.placements,
        props = Config.PropPresets or {},
        drops = Config.DropPresets or {},
        symbol = Config.CurrencySymbol,
        maxCredit = Config.MaxCredit,
        info = { framework = fw, inventory = inv },
    }
end)

RegisterNetEvent('kev_vending:creator:items', function()
    local src = source
    if not isAdmin(src) then return end
    TriggerLatentClientEvent('kev_vending:creator:items', src, 200000, Bridge.GetItems())
end)

RegisterCallback('creatorSave', function(src, data)
    if not isAdmin(src) then return { ok = false, reason = 'perm' } end
    if type(data) ~= 'table' then return { ok = false, reason = 'data' } end
    local id = normId(data.id)
    if not id then return { ok = false, reason = 'id' } end
    local oldId = type(data.oldId) == 'string' and data.oldId ~= '' and data.oldId or nil

    if oldId and oldId ~= id then
        if Config.Machines[oldId] then return { ok = false, reason = 'rename_config' } end
        if All[id] then return { ok = false, reason = 'exists' } end
    elseif not oldId and All[id] then
        return { ok = false, reason = 'exists' }
    end

    local m, err = sanitizeMachine(data)
    if not m then return { ok = false, reason = err } end

    Store.machines[id] = m
    if oldId and oldId ~= id then
        Store.machines[oldId] = nil
        for _, pl in ipairs(Store.placements) do
            if pl.machine == oldId then pl.machine = id end
        end
    end
    saveStore()
    rebuild()
    broadcast()
    log(src, ('guardó la máquina "%s"'):format(id))
    return { ok = true, id = id, machines = creatorData(), placements = Store.placements }
end)

RegisterCallback('creatorDelete', function(src, id)
    if not isAdmin(src) then return { ok = false, reason = 'perm' } end
    if type(id) ~= 'string' or not Store.machines[id] then return { ok = false, reason = 'config' } end
    Store.machines[id] = nil
    if not Config.Machines[id] then
        local keep = {}
        for _, pl in ipairs(Store.placements) do
            if pl.machine ~= id then keep[#keep + 1] = pl end
        end
        Store.placements = keep
    end
    saveStore()
    rebuild()
    broadcast()
    log(src, ('borró la máquina "%s"'):format(id))
    return { ok = true, machines = creatorData(), placements = Store.placements }
end)

RegisterCallback('creatorPlace', function(src, d)
    if not isAdmin(src) then return { ok = false, reason = 'perm' } end
    if type(d) ~= 'table' or type(d.machine) ~= 'string' or not All[d.machine] then return { ok = false, reason = 'data' } end
    local x, y, z = tonumber(d.x), tonumber(d.y), tonumber(d.z)
    if not (x and y and z) then return { ok = false, reason = 'data' } end
    local pos = vector3(x, y, z)
    if #(pedCoords(src) - pos) > (Config.Creator.placeDistance or 12.0) + 4.0 then return { ok = false, reason = 'far' } end

    local kind = d.kind == 'zone' and 'zone' or 'prop'
    local pl = {
        machine = d.machine, kind = kind,
        x = math.floor(x * 1000 + 0.5) / 1000, y = math.floor(y * 1000 + 0.5) / 1000, z = math.floor(z * 1000 + 0.5) / 1000,
        h = math.floor(num(d.h, -720, 720, 0) % 360 * 10 + 0.5) / 10,
    }
    if kind == 'prop' then
        pl.model = model(d.model)
        if not pl.model then return { ok = false, reason = 'model' } end
    else
        pl.counter = num(d.counter, 0.0, 2.5, 0.92)
    end
    Store.seq = Store.seq + 1
    pl.id = Store.seq
    Store.placements[#Store.placements + 1] = pl
    saveStore()
    broadcast()
    log(src, ('colocó "%s" (#%d) en %.1f, %.1f, %.1f'):format(pl.machine, pl.id, x, y, z))
    return { ok = true, id = pl.id, placements = Store.placements }
end)

RegisterCallback('creatorRemovePlacement', function(src, pid)
    if not isAdmin(src) then return { ok = false, reason = 'perm' } end
    pid = tonumber(pid)
    for i, pl in ipairs(Store.placements) do
        if pl.id == pid then
            table.remove(Store.placements, i)
            saveStore()
            broadcast()
            log(src, ('quitó la colocación #%d'):format(pid))
            return { ok = true, placements = Store.placements }
        end
    end
    return { ok = false, reason = 'data' }
end)
