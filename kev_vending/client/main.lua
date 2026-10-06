-- ==========================================================
--  kev_vending - cliente (utilidades + lógica en un solo archivo)
-- ==========================================================
KV = KV or {}

function KV.LoadDict(d)
    RequestAnimDict(d)
    local t = GetGameTimer() + 3000
    while not HasAnimDictLoaded(d) and GetGameTimer() < t do Wait(10) end
    return HasAnimDictLoaded(d)
end

function KV.LoadModel(m)
    if not IsModelInCdimage(m) then return false end
    RequestModel(m)
    local t = GetGameTimer() + 4000
    while not HasModelLoaded(m) and GetGameTimer() < t do Wait(10) end
    return HasModelLoaded(m)
end

-- anim = { dict, name, duration } ; flag 49 = upper body + loop si duration -1
function KV.Play(anim, flag)
    if not anim or not KV.LoadDict(anim[1]) then return end
    local dur = anim[3] or -1
    TaskPlayAnim(PlayerPedId(), anim[1], anim[2], 4.0, -4.0, dur, flag or (dur == -1 and 1 or 0), 0.0, false, false, false)
end

-- ---------- "marco" de una máquina: posición, rotación y tamaño ----------
function KV.FrameFromEntity(ent)
    local mn, mx = GetModelDimensions(GetEntityModel(ent))
    return { entity = ent, pos = GetEntityCoords(ent), heading = GetEntityHeading(ent), min = mn, max = mx }
end

-- para Config.Locations: stand = donde se para el jugador mirando la máquina
function KV.FrameFromLocation(loc)
    local h = loc.stand.w
    local r = math.rad(h)
    local fwd = vec3(-math.sin(r), math.cos(r), 0.0)
    local w, d, ht = loc.width or 0.8, loc.depth or 0.55, loc.height or 0.6
    local ground = loc.stand.z - 0.98
    local origin = vec3(loc.stand.x, loc.stand.y, ground) + fwd * (0.5 + d / 2)
    local base = loc.counter or 0.92
    return {
        pos = origin, heading = h,
        min = vec3(-w / 2, -d / 2, base), max = vec3(w / 2, d / 2, base + ht),
    }
end

-- local -> mundo
function KV.Off(f, v)
    local r = math.rad(f.heading)
    local c, s = math.cos(r), math.sin(r)
    return vec3(f.pos.x + v.x * c - v.y * s, f.pos.y + v.x * s + v.y * c, f.pos.z + v.z)
end

function KV.Size(f) return f.max.x - f.min.x, f.max.y - f.min.y, f.max.z - f.min.z end

-- ---------- cámara ----------
KV.cam = nil

function KV.CamTo(pos, look, fov, ms)
    local cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', pos.x, pos.y, pos.z, 0.0, 0.0, 0.0, fov or 50.0, false, 0)
    PointCamAtCoord(cam, look.x, look.y, look.z)
    if KV.cam then
        local old = KV.cam
        SetCamActiveWithInterp(cam, old, ms or 700, 1, 1)
        KV.cam = cam
        Wait(ms or 700)
        DestroyCam(old, false)
    else
        SetCamActive(cam, true)
        RenderScriptCams(true, true, ms or 900, true, true)
        KV.cam = cam
    end
end

function KV.CamReset(ms)
    RenderScriptCams(false, true, ms or 800, true, true)
    if KV.cam then DestroyCam(KV.cam, false) KV.cam = nil end
end

-- cámara principal según el tamaño real del modelo
function KV.MainCam(f, kind, ms)
    local c = Config.Camera[kind] or Config.Camera.vending
    local W, D, H = KV.Size(f)
    local pos  = KV.Off(f, vec3(f.max.x + c.side, f.min.y - c.back, f.min.z + H * c.height))
    local look = KV.Off(f, vec3(c.lookSide or 0.0, f.min.y, f.min.z + H * c.look))
    KV.CamTo(pos, look, c.fov, ms or Config.Camera.interp)
end

-- cámara hacia donde sale el producto
function KV.SpotCam(f, spotWorld, ms)
    local W, D, H = KV.Size(f)
    local pos = KV.Off(f, vec3(f.max.x + 0.35, f.min.y - 1.25, f.min.z + math.min(1.0, H * 0.5)))
    KV.CamTo(pos, spotWorld, 45.0, ms or 650)
end

-- ---------- texto 3D (etiqueta con barra de color) ----------
local function hexToRgb(hex)
    hex = tostring(hex or ''):gsub('#', '')
    if #hex ~= 6 then return 255, 210, 60 end
    return tonumber(hex:sub(1, 2), 16) or 255, tonumber(hex:sub(3, 4), 16) or 210, tonumber(hex:sub(5, 6), 16) or 60
end

function KV.Text3D(c, text, accent)
    local onScreen, x, y = World3dToScreen2d(c.x, c.y, c.z)
    if not onScreen then return end
    local full = '~y~E~s~  ' .. text
    SetTextScale(0.0, 0.34)
    SetTextFont(4)
    BeginTextCommandGetWidth('STRING')
    AddTextComponentSubstringPlayerName(full)
    local w = EndTextCommandGetWidth(true) + 0.016
    local r, g, b = hexToRgb(accent)
    DrawRect(x, y + 0.0135, w, 0.032, 10, 10, 12, 185)
    DrawRect(x - w / 2 + 0.0016, y + 0.0135, 0.0032, 0.032, r, g, b, 235)
    SetTextScale(0.0, 0.34)
    SetTextFont(4)
    SetTextColour(255, 255, 255, 240)
    SetTextCentre(true)
    BeginTextCommandDisplayText('STRING')
    AddTextComponentSubstringPlayerName(full)
    EndTextCommandDisplayText(x + 0.002, y)
end

-- ---------- prop en la mano ----------
function KV.HoldProp(model, anim, ms)
    local hash = type(model) == 'number' and model or joaat(model)
    if not KV.LoadModel(hash) then return end
    local ped = PlayerPedId()
    local obj = CreateObject(hash, 0.0, 0.0, 0.0, true, true, false)
    AttachEntityToEntity(obj, ped, GetPedBoneIndex(ped, 28422), 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, true, true, false, true, 1, true)
    KV.Play(anim, 49)
    Wait(ms or 2500)
    ClearPedSecondaryTask(ped)
    DeleteEntity(obj)
    SetModelAsNoLongerNeeded(hash)
end


local function hashOf(m) return type(m) == 'number' and m or joaat(m) end

-- ==========================================================
--  REGISTRO (llega del servidor: config.lua + creador)
-- ==========================================================
KV.Machines   = {}
KV.Placements = {}

local machineOfModel, modelList, modelNames = {}, {}, {}
local current          -- { id, cfg, frame, dispensing }
local drops = {}       -- [id] = { netId, label, owner, mode }
local picking = false
local nearThing        -- { ent = entity } | { loc = location }
local useTarget = false

local placed = {}          -- [pid] = { data, ent, key }
local placedByEntity = {}  -- [entity] = pid
local registered = {}      -- [machineId] = { models, name, label }
local zoneHandles = {}
local zoneList = {}        -- { loc, machine }

-- ==========================================================
--  abrir / cerrar
-- ==========================================================
local function closeUI()
    if not current then return end
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
    KV.CamReset(800)
    ClearPedTasks(PlayerPedId())
    current = nil
end

local function lockControls()
    CreateThread(function()
        while current do
            DisableAllControlActions(0)
            EnableControlAction(0, 249, true) -- push to talk
            HideHudAndRadarThisFrame()
            Wait(0)
        end
    end)
end

local function guessShape(p)
    if p.shape then return p.shape end
    local n = tostring(p.prop or '')
    if n:find('bottle') or n:find('bot_') then return 'bottle' end
    if n:find('choc') or n:find('candy') or n:find('crisp') or n:find('snak') or n:find('bar') then return 'snack' end
    if n:find('cup') then return 'cup' end
    return 'can'
end

local function open(frame, id)
    if current or picking or KV.creatorBusy then return end
    local cfg = KV.Machines[id]
    if not cfg then return end

    local res = Bridge.Call('open', id, frame.pos)
    if not res or not res.ok then
        if res and res.reason == 'busy' then Bridge.Notify(Config.Text.busy, 'error') end
        return
    end
    current = { id = id, cfg = cfg, frame = frame }

    -- caminar al frente
    local ped = PlayerPedId()
    local stand = frame.standPos or KV.Off(frame, vec3((frame.min.x + frame.max.x) / 2, frame.min.y - 0.55, 0.0))
    TaskGoStraightToCoord(ped, stand.x, stand.y, GetEntityCoords(ped).z, 1.0, 4000, frame.heading, 0.05)
    local t = GetGameTimer() + 4000
    while #(GetEntityCoords(ped).xy - stand.xy) > 0.3 and GetGameTimer() < t do Wait(50) end
    ClearPedTasks(ped)
    SetEntityHeading(ped, frame.heading)

    lockControls()
    KV.MainCam(frame, cfg.type)
    if cfg.type == 'dispenser' then KV.Play(Config.Anims.counter) end

    local products = {}
    for i, p in ipairs(cfg.products or {}) do
        products[i] = { label = p.label, price = p.price, color = p.color, shape = guessShape(p) }
    end
    local taps = {}
    for i, tp in ipairs(cfg.taps or {}) do taps[i] = { label = tp.label, color = tp.color, ice = tp.ice or false } end

    SendNUIMessage({
        action    = 'open',
        screen    = cfg.type == 'dispenser' and 'dispenser' or 'vending',
        type      = cfg.type,
        style     = cfg.style,
        brand     = cfg.brand,
        color     = cfg.color,
        logo      = cfg.logo,
        products  = products,
        taps      = taps,
        cups      = cfg.cups,
        sugar     = cfg.sugar or false,
        coins     = res.coins,
        cash      = res.cash,
        symbol    = Config.CurrencySymbol,
        maxCredit = Config.MaxCredit,
    })
    SetNuiFocus(true, true)
end

-- algunos props tienen el frente al revés: usa flip = true en la config
local function frameFor(ent, cfg)
    local f = KV.FrameFromEntity(ent)
    if cfg and cfg.flip then
        f.heading = f.heading + 180.0
        f.min, f.max = vec3(-f.max.x, -f.max.y, f.min.z), vec3(-f.min.x, -f.min.y, f.max.z)
    end
    return f
end

KV.FrameFor = frameFor

local function machineIdFor(ent)
    local pid = placedByEntity[ent]
    if pid and placed[pid] then return placed[pid].data.machine end
    return machineOfModel[GetEntityModel(ent)]
end

local function openEntity(ent)
    if not ent or ent == 0 then return end
    local id = machineIdFor(ent)
    if id and KV.Machines[id] then open(frameFor(ent, KV.Machines[id]), id) end
end

local function openLocation(loc)
    local f = KV.FrameFromLocation(loc)
    f.standPos = vec3(loc.stand.x, loc.stand.y, loc.stand.z)
    open(f, loc.machine)
end

-- ==========================================================
--  despachar (vending / café)
-- ==========================================================
local function spotWorld(f, cfg, mode)
    local W, D, H = KV.Size(f)
    local sp = cfg.spot or { x = 0.0, y = 0.22 }
    local y = (mode == 'bay') and (f.min.y + (cfg.bayDepth or 0.07)) or (f.min.y - 0.12)
    return KV.Off(f, vec3((f.min.x + f.max.x) / 2 + W * (sp.x or 0.0), y, f.min.z + H * (sp.y or 0.22)))
end

local function spawnDrop(s, r)
    local f, cfg = s.frame, s.cfg
    local hash = hashOf(r.prop or 'prop_ecola_can')
    if not IsModelInCdimage(hash) then hash = (r.mode == 'bay') and joaat('p_amb_coffeecup_01') or joaat('prop_ecola_can') end
    KV.LoadModel(hash)

    local p = spotWorld(f, cfg, r.mode)
    local obj = CreateObject(hash, p.x, p.y, p.z, true, true, false)
    if r.mode == 'bay' then
        SetEntityHeading(obj, f.heading)
        FreezeEntityPosition(obj, true)
    else
        local name = type(r.prop) == 'string' and r.prop or ''
        local lay = (name:find('can') or name:find('bottle')) and 90.0 or 0.0
        SetEntityRotation(obj, lay, 0.0, f.heading + math.random(-40, 40) + 0.0, 2, true)
        SetEntityDynamic(obj, true)
        ActivatePhysics(obj)
        local dir = KV.Off(f, vec3(0.0, -1.0, 0.0)) - f.pos
        SetEntityVelocity(obj, dir.x * 1.3, dir.y * 1.3, 0.5)
    end
    SetModelAsNoLongerNeeded(hash)

    local t = GetGameTimer() + 1500
    while not NetworkGetEntityIsNetworked(obj) and GetGameTimer() < t do
        NetworkRegisterEntityAsNetworked(obj)
        Wait(10)
    end
    local netId = ObjToNet(obj)
    SetNetworkIdCanMigrate(netId, true)
    SetNetworkIdExistsOnAllMachines(netId, true)
    Bridge.Call('registerDrop', r.dropId, netId)
    return obj, p
end

local function finishSession(s, r)
    if current ~= s then return end
    SendNUIMessage({ action = 'dispensed', label = r.label, mode = r.mode })
    if Config.AutoClose then
        local c = Bridge.Call('close') or {}
        local n = c.refunded or 0
        SendNUIMessage({ action = 'change', refunded = n })
        Wait(n > 0 and 1600 or 900)
        closeUI()
    else
        KV.MainCam(s.frame, s.cfg.type, 650)
        s.dispensing = false
    end
end

local function doVending(s, r)
    SendNUIMessage({ action = 'motor' })
    Wait(900)
    KV.SpotCam(s.frame, spotWorld(s.frame, s.cfg, 'floor') - vec3(0.0, 0.0, 0.2), 650)
    spawnDrop(s, r)
    Wait(300)
    SendNUIMessage({ action = 'thud' })
    Wait(1300)
    finishSession(s, r)
end

local function doCoffee(s, r)
    SendNUIMessage({ action = 'cupdrop' })
    Wait(600)
    local spot = spotWorld(s.frame, s.cfg, 'bay')
    KV.SpotCam(s.frame, spot, 650)
    spawnDrop(s, r)
    SendNUIMessage({ action = 'brew', ms = Config.CoffeeBrewTime })

    local fx
    local sf = Config.SteamFx
    if sf then
        RequestNamedPtfxAsset(sf.asset)
        local t = GetGameTimer() + 2000
        while not HasNamedPtfxAssetLoaded(sf.asset) and GetGameTimer() < t do Wait(10) end
        if HasNamedPtfxAssetLoaded(sf.asset) then
            UseParticleFxAssetNextCall(sf.asset)
            fx = StartParticleFxLoopedAtCoord(sf.name, spot.x, spot.y, spot.z + 0.12, 0.0, 0.0, 0.0, sf.scale or 0.2, false, false, false, false)
        end
    end
    Wait(Config.CoffeeBrewTime)
    if fx then SetTimeout(10000, function() StopParticleFxLooped(fx, false) end) end
    finishSession(s, r)
end

-- ==========================================================
--  callbacks de la UI
-- ==========================================================
RegisterNUICallback('insertCoin', function(_, cb)
    if not current then return cb({ ok = false }) end
    KV.Play(Config.Anims.coin)
    cb(Bridge.Call('insertCoin') or { ok = false })
end)

RegisterNUICallback('select', function(data, cb)
    local s = current
    if not s or s.dispensing then return cb({ ok = false, reason = 'busy' }) end
    KV.Play(Config.Anims.button)
    local r = Bridge.Call('buy', data.index, data.sugar) or { ok = false }
    if r.ok then s.dispensing = true end
    cb(r)
    if r.ok then
        CreateThread(function()
            if r.mode == 'bay' then doCoffee(s, r) else doVending(s, r) end
        end)
    end
end)

RegisterNUICallback('refund', function(_, cb)
    if not current then return cb({ ok = false }) end
    cb(Bridge.Call('refund') or { ok = false })
end)

RegisterNUICallback('close', function(_, cb)
    if not current or current.dispensing then return cb({ ok = false }) end
    local r = Bridge.Call('close') or { ok = false }
    cb(r)
    CreateThread(function()
        Wait((r.refunded or 0) > 0 and 1000 or 0)
        closeUI()
    end)
end)

RegisterNUICallback('dispFinish', function(data, cb)
    local s = current
    if not s or s.dispensing then return cb({ ok = false }) end
    s.dispensing = true
    local r = Bridge.Call('finishCup', data) or { ok = false }
    cb(r)
    if not r.ok then s.dispensing = false return end
    CreateThread(function()
        Wait(1600) -- la UI anima la tapa y la calificación
        if current == s then closeUI() end
        Bridge.Notify(Config.Text.got_drink:format(r.label .. ' ' .. (r.size or '')), 'success')
        KV.HoldProp(r.prop or 'ng_proc_sodacup_01a', Config.Anims.hold, 2500)
    end)
end)

-- ==========================================================
--  productos en el suelo / en la bahía
-- ==========================================================
RegisterNetEvent('kev_vending:dropAdded', function(id, d) drops[id] = d end)

RegisterNetEvent('kev_vending:dropRemoved', function(id, netId)
    drops[id] = nil
    if netId and NetworkDoesNetworkIdExist(netId) then
        local e = NetToObj(netId)
        if DoesEntityExist(e) and NetworkHasControlOfEntity(e) then
            SetEntityAsMissionEntity(e, true, true)
            DeleteEntity(e)
        end
    end
end)

local function pickup(n)
    picking = true
    local ped = PlayerPedId()
    TaskTurnPedToFaceCoord(ped, n.c.x, n.c.y, n.c.z, 600)
    Wait(600)
    KV.Play(n.d.mode == 'bay' and Config.Anims.grab or Config.Anims.pickup)
    Wait(750)
    local r = Bridge.Call('pickup', n.id)
    if r and r.ok then
        Bridge.Notify(Config.Text.picked:format(r.label), 'success')
        if r.mode == 'bay' then
            Wait(300)
            KV.HoldProp('p_amb_coffeecup_01', Config.Anims.hold, 2500)
        end
    elseif r and r.reason == 'full' then
        Bridge.Notify(Config.Text.inv_full, 'error')
    elseif r and r.reason == 'not_yours' then
        Bridge.Notify(Config.Text.not_yours, 'error')
    end
    Wait(350)
    picking = false
end

-- ==========================================================
--  props colocados con el creador
-- ==========================================================
local function placedKey(pl)
    local m = KV.Machines[pl.machine]
    return table.concat({ pl.machine, tostring(pl.model), pl.x, pl.y, pl.z, pl.h, m and m.label or '', m and tostring(m.flip) or '' }, '|')
end

local function despawnPlaced(pid)
    local p = placed[pid]
    if not p then return end
    if p.ent and DoesEntityExist(p.ent) then
        if p.target then Bridge.RemoveEntity(p.ent, 'kev_vending_p_' .. pid, p.label) end
        placedByEntity[p.ent] = nil
        DeleteEntity(p.ent)
    end
    p.ent, p.target = nil, nil
end

local function spawnPlaced(pid)
    local p = placed[pid]
    local pl, cfg = p.data, KV.Machines[p.data.machine]
    if not cfg then return end
    local hash = hashOf(pl.model)
    if not KV.LoadModel(hash) then return end
    local obj = CreateObjectNoOffset(hash, pl.x + 0.0, pl.y + 0.0, pl.z + 0.0, false, false, false)
    SetEntityHeading(obj, (pl.h or 0.0) + 0.0)
    FreezeEntityPosition(obj, true)
    SetEntityInvincible(obj, true)
    SetEntityCanBeDamaged(obj, false)
    SetModelAsNoLongerNeeded(hash)
    p.ent, p.label = obj, cfg.label or Config.Text.use
    placedByEntity[obj] = pid
    p.target = Bridge.AddEntity(obj, 'kev_vending_p_' .. pid, p.label, openEntity)
end

KV.IsPlacedEntity = function(ent) return placedByEntity[ent] ~= nil end

-- ==========================================================
--  sincronización con el servidor
-- ==========================================================
local function canUseModel(ent) return not placedByEntity[ent] end

local function applySync(data)
    if type(data) ~= 'table' then return end
    KV.Machines   = data.machines or {}
    KV.Placements = data.placements or {}

    -- 1) modelos del mapa
    for _, r in pairs(registered) do Bridge.RemoveModels(r.models, r.name, r.label) end
    registered = {}
    machineOfModel, modelList, modelNames = {}, {}, {}
    useTarget = false
    for id, cfg in pairs(KV.Machines) do
        local list = {}
        for _, m in ipairs(cfg.models or {}) do
            local h = hashOf(m)
            machineOfModel[h] = id
            modelList[#modelList + 1] = h
            list[#list + 1] = h
            if type(m) == 'string' then modelNames[h] = m end
        end
        local name, label = 'kev_vending_m_' .. id, cfg.label or Config.Text.use
        if #list > 0 then
            useTarget = Bridge.AddModels(list, name, label, openEntity, canUseModel) or useTarget
            registered[id] = { models = list, name = name, label = label }
        end
    end
    if not useTarget then useTarget = Bridge.GetTarget() ~= 'textui' end

    -- 2) zonas (Config.Locations + marcadas con el creador)
    for _, h in ipairs(zoneHandles) do Bridge.RemoveZone(h) end
    zoneHandles, zoneList = {}, {}
    local function addZone(key, loc)
        local cfg = KV.Machines[loc.machine]
        if not cfg then return end
        zoneList[#zoneList + 1] = loc
        local f = KV.FrameFromLocation(loc)
        local c = KV.Off(f, vec3(0.0, 0.0, (f.min.z + f.max.z) / 2))
        zoneHandles[#zoneHandles + 1] = Bridge.AddZone(key, c, cfg.label or Config.Text.use, function() openLocation(loc) end)
    end
    for i, loc in ipairs(Config.Locations or {}) do addZone('cfg' .. i, loc) end
    for _, pl in ipairs(KV.Placements) do
        if pl.kind == 'zone' then
            addZone('pl' .. pl.id, { machine = pl.machine, stand = vec4(pl.x, pl.y, pl.z, pl.h or 0.0), counter = pl.counter })
        end
    end

    -- 3) props colocados (solo se recrean los que cambiaron)
    local alive = {}
    for _, pl in ipairs(KV.Placements) do
        if pl.kind ~= 'zone' and pl.model then
            local key = placedKey(pl)
            alive[pl.id] = true
            if placed[pl.id] and placed[pl.id].key ~= key then despawnPlaced(pl.id) placed[pl.id] = nil end
            placed[pl.id] = placed[pl.id] or { key = key }
            placed[pl.id].data = pl
        end
    end
    for pid in pairs(placed) do
        if not alive[pid] then despawnPlaced(pid) placed[pid] = nil end
    end

    if KV.OnSync then KV.OnSync() end
end

RegisterNetEvent('kev_vending:sync', applySync)

-- aparecer / desaparecer props colocados según la distancia
CreateThread(function()
    while true do
        local pc = GetEntityCoords(PlayerPedId())
        local dist = (Config.Creator and Config.Creator.spawnDistance) or 90.0
        for pid, p in pairs(placed) do
            local d = #(pc - vec3(p.data.x, p.data.y, p.data.z))
            if d < dist and not (p.ent and DoesEntityExist(p.ent)) then
                spawnPlaced(pid)
            elseif d > dist + 15.0 and p.ent then
                despawnPlaced(pid)
            end
        end
        Wait(1000)
    end
end)

-- ==========================================================
--  inicio + detección en modo [E]
-- ==========================================================
CreateThread(function()
    Wait(1000)
    applySync(Bridge.Call('sync'))

    local list = Bridge.Call('getDrops')
    for _, d in ipairs(list or {}) do drops[d.id] = d end

    while true do
        local found
        if not current and not useTarget then
            local pc = GetEntityCoords(PlayerPedId())
            for _, p in pairs(placed) do
                if p.ent and DoesEntityExist(p.ent) and #(pc - GetEntityCoords(p.ent)) < Config.InteractDistance + 0.6 then
                    found = { ent = p.ent } break
                end
            end
            if not found then
                for _, m in ipairs(modelList) do
                    local o = GetClosestObjectOfType(pc.x, pc.y, pc.z, Config.InteractDistance + 0.6, m, false, false, false)
                    if o ~= 0 and not placedByEntity[o] then found = { ent = o } break end
                end
            end
            if not found then
                for _, loc in ipairs(zoneList) do
                    if #(pc - vec3(loc.stand.x, loc.stand.y, loc.stand.z)) < Config.InteractDistance then found = { loc = loc } break end
                end
            end
        end
        nearThing = found
        Wait(350)
    end
end)

-- ==========================================================
--  bucle principal
-- ==========================================================
CreateThread(function()
    local myId = GetPlayerServerId(PlayerId())
    while true do
        local sleep = 400
        if not current and not picking and not KV.creatorBusy then
            local pc = GetEntityCoords(PlayerPedId())
            local near

            for id, d in pairs(drops) do
                if (Config.AllowOthersPickup or d.owner == myId) and NetworkDoesNetworkIdExist(d.netId) then
                    local e = NetToObj(d.netId)
                    if DoesEntityExist(e) then
                        local ec = GetEntityCoords(e)
                        local dist = #(pc - ec)
                        if dist < 10.0 then
                            sleep = 0
                            DrawMarker(2, ec.x, ec.y, ec.z + 0.3, 0.0, 0.0, 0.0, 180.0, 0.0, 0.0,
                                0.1, 0.1, 0.1, 255, 210, 60, 160, true, true, 2, false, nil, nil, false)
                        end
                        if dist < Config.PickupDistance and not near then near = { id = id, e = e, d = d, c = ec } end
                    end
                end
            end

            if near then
                local txt = (near.d.mode == 'bay' and Config.Text.take or Config.Text.pickup):format(near.d.label)
                KV.Text3D(near.c + vec3(0.0, 0.0, 0.2), txt, '#ffd23f')
                if IsControlJustReleased(0, 38) then
                    local n = near
                    CreateThread(function() pickup(n) end)
                end
            elseif not useTarget and nearThing then
                sleep = 0
                local label, pos, accent
                if nearThing.ent and DoesEntityExist(nearThing.ent) then
                    local id = machineIdFor(nearThing.ent)
                    local cfg = id and KV.Machines[id]
                    if cfg then
                        local f = frameFor(nearThing.ent, cfg)
                        label, accent = cfg.label or Config.Text.use, cfg.color
                        pos = KV.Off(f, vec3(0.0, f.min.y - 0.05, math.min(f.max.z, f.min.z + 1.3)))
                    end
                elseif nearThing.loc then
                    local cfg = KV.Machines[nearThing.loc.machine]
                    if cfg then
                        local f = KV.FrameFromLocation(nearThing.loc)
                        label, accent = cfg.label or Config.Text.use, cfg.color
                        pos = KV.Off(f, vec3(0.0, f.min.y, f.max.z + 0.1))
                    end
                end
                if pos then
                    KV.Text3D(pos, label, accent)
                    if IsControlJustReleased(0, 38) then
                        local n = nearThing
                        CreateThread(function()
                            if n.ent then openEntity(n.ent) else openLocation(n.loc) end
                        end)
                    end
                end
            end
        end
        Wait(sleep)
    end
end)

-- ==========================================================
--  comandos de ayuda para configurar
-- ==========================================================
function KV.RotDir(rot)
    local z, x = math.rad(rot.z), math.rad(rot.x)
    local n = math.abs(math.cos(x))
    return vec3(-math.sin(z) * n, math.cos(z) * n, math.sin(x))
end

if Config.DevCommands then
    RegisterCommand('kvmodel', function()
        local from = GetGameplayCamCoord()
        local to = from + KV.RotDir(GetGameplayCamRot(2)) * 8.0
        local ray = StartShapeTestLosProbe(from.x, from.y, from.z, to.x, to.y, to.z, 16, PlayerPedId(), 0)
        local st, hit, _, _, ent = GetShapeTestResult(ray)
        while st == 1 do Wait(0) st, hit, _, _, ent = GetShapeTestResult(ray) end
        if hit == 1 and ent ~= 0 and GetEntityType(ent) == 3 then
            local h = GetEntityModel(ent)
            local name = modelNames[h] or 'desconocido'
            local owner = machineIdFor(ent)
            local txt = ('Modelo: %s | hash: %d%s'):format(name, h, owner and (' | ya configurado como "' .. owner .. '"') or '')
            print('[kev_vending] ' .. txt)
            SendNUIMessage({ action = 'copy', text = tostring(h) })
            Bridge.Notify(txt .. ' (hash copiado)', 'inform')
        else
            Bridge.Notify('No estás mirando un objeto. Si es parte del mapa usa /kvcoords o el creador (/' .. ((Config.Creator and Config.Creator.command) or 'kvcreator') .. ').', 'error')
        end
    end, false)

    RegisterCommand('kvcoords', function()
        local c = GetEntityCoords(PlayerPedId())
        local txt = ('vec4(%.2f, %.2f, %.2f, %.1f)'):format(c.x, c.y, c.z, GetEntityHeading(PlayerPedId()))
        print('[kev_vending] stand = ' .. txt)
        SendNUIMessage({ action = 'copy', text = txt })
        Bridge.Notify('stand = ' .. txt .. ' (copiado)', 'inform')
    end, false)
end

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    if current then closeUI() end
    for _, r in pairs(registered) do Bridge.RemoveModels(r.models, r.name, r.label) end
    for _, h in ipairs(zoneHandles) do Bridge.RemoveZone(h) end
    for pid in pairs(placed) do despawnPlaced(pid) end
end)
