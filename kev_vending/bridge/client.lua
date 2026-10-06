-- ==========================================================
--  BRIDGE CLIENTE: callbacks, notificaciones y target
-- ==========================================================
Bridge = {}

local function started(res) return GetResourceState(res) == 'started' end

-- ---------- callbacks al servidor ----------
local cbId, pending = 0, {}

function Bridge.Call(name, ...)
    cbId = cbId + 1
    local id = cbId
    local p = promise.new()
    pending[id] = p
    TriggerServerEvent('kev_vending:cb:req', name, id, ...)
    SetTimeout(10000, function()
        if pending[id] then pending[id] = nil p:resolve(nil) end
    end)
    return Citizen.Await(p)
end

RegisterNetEvent('kev_vending:cb:res', function(id, result)
    local p = pending[id]
    if p then pending[id] = nil p:resolve(result) end
end)

-- ---------- notificaciones ----------
local notifyMode
local function detectNotify()
    if Config.Notify ~= 'auto' then return Config.Notify end
    if started('ox_lib') then return 'ox_lib' end
    if started('okokNotify') then return 'okok' end
    if started('brutal_notify') then return 'brutal' end
    if started('lation_ui') then return 'lation' end
    if started('mythic_notify') then return 'mythic' end
    if started('qb-core') then return 'qb' end
    if started('es_extended') then return 'esx' end
    return 'native'
end

function Bridge.Notify(msg, typ, title)
    typ = typ or 'inform'
    title = title or Config.NotifyTitle
    notifyMode = notifyMode or detectNotify()
    local info = (typ == 'inform') and 'info' or typ
    local time = Config.NotifyTime or 5000

    if notifyMode == 'custom' then
        local ok, err = pcall(Config.CustomNotify, msg, typ, title)
        if not ok then print('[kev_vending] CustomNotify error: ' .. tostring(err)) end
    elseif notifyMode == 'ox_lib' then
        TriggerEvent('ox_lib:notify', { title = title, description = msg, type = typ, duration = time })
    elseif notifyMode == 'okok' then
        exports['okokNotify']:Alert(title, msg, time, info)
    elseif notifyMode == 'brutal' then
        exports['brutal_notify']:SendAlert(title, msg, time, info)
    elseif notifyMode == 'lation' then
        exports.lation_ui:notify({ title = title, message = msg, type = info, duration = time })
    elseif notifyMode == 'mythic' then
        exports['mythic_notify']:DoHudText(typ, msg)
    elseif notifyMode == 'qb' then
        TriggerEvent('QBCore:Notify', msg, typ == 'inform' and 'primary' or typ, time)
    elseif notifyMode == 'esx' then
        TriggerEvent('esx:showNotification', msg, info, time)
    else
        BeginTextCommandThefeedPost('STRING')
        AddTextComponentSubstringPlayerName(msg)
        EndTextCommandThefeedPostTicker(false, true)
    end
end
RegisterNetEvent('kev_vending:notify', Bridge.Notify)

-- ---------- target ----------
function Bridge.GetTarget()
    if Config.Target ~= 'auto' then return Config.Target end
    if started('ox_target') then return 'ox_target' end
    if started('qb-target') then return 'qb-target' end
    return 'textui'
end

-- modelos (objetos del mundo). name = id único de la opción
function Bridge.AddModels(models, name, label, onUse, canInteract)
    local t = Bridge.GetTarget()
    if t == 'ox_target' then
        exports.ox_target:addModel(models, {
            {
                name = name,
                icon = 'fa-solid fa-coins',
                label = label,
                distance = Config.InteractDistance,
                canInteract = canInteract and function(entity) return canInteract(entity) end or nil,
                onSelect = function(data) CreateThread(function() onUse(data.entity) end) end,
            },
        })
        return true
    elseif t == 'qb-target' then
        exports['qb-target']:AddTargetModel(models, {
            options = {
                { icon = 'fas fa-coins', label = label,
                  canInteract = canInteract and function(entity) return canInteract(entity) end or nil,
                  action = function(entity) CreateThread(function() onUse(entity) end) end },
            },
            distance = Config.InteractDistance,
        })
        return true
    end
    return false
end

function Bridge.RemoveModels(models, name, label)
    local t = Bridge.GetTarget()
    if t == 'ox_target' then
        pcall(function() exports.ox_target:removeModel(models, name) end)
    elseif t == 'qb-target' then
        pcall(function() exports['qb-target']:RemoveTargetModel(models, label) end)
    end
end

-- props colocados con el creador (entidades locales)
function Bridge.AddEntity(ent, name, label, onUse)
    local t = Bridge.GetTarget()
    if t == 'ox_target' then
        exports.ox_target:addLocalEntity(ent, {
            { name = name, icon = 'fa-solid fa-coins', label = label, distance = Config.InteractDistance,
              onSelect = function(data) CreateThread(function() onUse(data.entity) end) end },
        })
        return true
    elseif t == 'qb-target' then
        exports['qb-target']:AddTargetEntity(ent, {
            options = { { icon = 'fas fa-coins', label = label, action = function(entity) CreateThread(function() onUse(entity) end) end } },
            distance = Config.InteractDistance,
        })
        return true
    end
    return false
end

function Bridge.RemoveEntity(ent, name, label)
    local t = Bridge.GetTarget()
    if t == 'ox_target' then
        pcall(function() exports.ox_target:removeLocalEntity(ent, name) end)
    elseif t == 'qb-target' then
        pcall(function() exports['qb-target']:RemoveTargetEntity(ent, label) end)
    end
end

-- zonas fijas (máquinas que son parte del mapa). Devuelve un handle para quitarla luego.
function Bridge.AddZone(id, coords, label, onUse)
    local t = Bridge.GetTarget()
    if t == 'ox_target' then
        local z = exports.ox_target:addSphereZone({
            coords = coords, radius = 0.9,
            options = { { name = 'kev_vending_zone_' .. id, icon = 'fa-solid fa-glass-water', label = label,
                          distance = Config.InteractDistance + 0.5,
                          onSelect = function() CreateThread(onUse) end } },
        })
        return { t = t, z = z }
    elseif t == 'qb-target' then
        local name = 'kev_vending_zone_' .. id
        exports['qb-target']:AddCircleZone(name, coords, 0.9, { name = name, debugPoly = false, useZ = true }, {
            options = { { icon = 'fas fa-glass-water', label = label, action = function() CreateThread(onUse) end } },
            distance = Config.InteractDistance + 0.5,
        })
        return { t = t, z = name }
    end
    return nil
end

function Bridge.RemoveZone(h)
    if not h then return end
    if h.t == 'ox_target' then
        pcall(function() exports.ox_target:removeZone(h.z) end)
    elseif h.t == 'qb-target' then
        pcall(function() exports['qb-target']:RemoveZone(h.z) end)
    end
end
