-- ==========================================================
--  kev_vending - CREADOR DE MÁQUINAS (cliente)
--  /kvcreator  -> abre el panel (el servidor revisa permisos)
-- ==========================================================
if not (Config.Creator and Config.Creator.enabled) then return end

KV.creatorBusy = false
local creatorOpen = false

local function hashOf(m)
    if type(m) == 'number' then return m end
    local n = tonumber(m)
    if n then return math.floor(n) end
    return joaat(m)
end

local function showCreator(extra)
    local msg = { action = 'creatorShow' }
    for k, v in pairs(extra or {}) do msg[k] = v end
    SendNUIMessage(msg)
    SetNuiFocus(true, true)
    creatorOpen, KV.creatorBusy = true, true
end

local function hideCreator()
    SendNUIMessage({ action = 'creatorHide' })
    SetNuiFocus(false, false)
end

local function openCreator()
    if creatorOpen or KV.creatorBusy then return end
    local r = Bridge.Call('creatorOpen')
    if not r or not r.ok then
        Bridge.Notify('No tienes permiso para usar el creador de máquinas.', 'error')
        return
    end
    r.action = 'creator'
    r.ok = nil
    SendNUIMessage(r)
    SetNuiFocus(true, true)
    creatorOpen, KV.creatorBusy = true, true
end

RegisterCommand(Config.Creator.command or 'kvcreator', function() CreateThread(openCreator) end, false)
AddEventHandler('kev_vending:openCreator', function() CreateThread(openCreator) end)
exports('OpenCreator', function() CreateThread(openCreator) end)

-- ==========================================================
--  botones de ayuda (scaleform de GTA)
-- ==========================================================
local function instructional(buttons)
    local sf = RequestScaleformMovie('instructional_buttons')
    local t = GetGameTimer() + 3000
    while not HasScaleformMovieLoaded(sf) and GetGameTimer() < t do Wait(0) end
    BeginScaleformMovieMethod(sf, 'CLEAR_ALL') EndScaleformMovieMethod()
    BeginScaleformMovieMethod(sf, 'SET_CLEAR_SPACE') ScaleformMovieMethodAddParamInt(200) EndScaleformMovieMethod()
    for i, b in ipairs(buttons) do
        BeginScaleformMovieMethod(sf, 'SET_DATA_SLOT')
        ScaleformMovieMethodAddParamInt(i - 1)
        ScaleformMovieMethodAddParamPlayerNameString(GetControlInstructionalButton(0, b[1], true))
        BeginTextCommandScaleformString('STRING')
        AddTextComponentScaleform(b[2])
        EndTextCommandScaleformString()
        EndScaleformMovieMethod()
    end
    BeginScaleformMovieMethod(sf, 'SET_BACKGROUND_COLOUR')
    ScaleformMovieMethodAddParamInt(0) ScaleformMovieMethodAddParamInt(0) ScaleformMovieMethodAddParamInt(0) ScaleformMovieMethodAddParamInt(90)
    EndScaleformMovieMethod()
    BeginScaleformMovieMethod(sf, 'DRAW_INSTRUCTIONAL_BUTTONS') EndScaleformMovieMethod()
    return sf
end

local function drawFrame(f, r, g, b)
    local c = {}
    for _, x in ipairs({ f.min.x, f.max.x }) do
        for _, y in ipairs({ f.min.y, f.max.y }) do
            for _, z in ipairs({ f.min.z, f.max.z }) do c[#c + 1] = KV.Off(f, vec3(x, y, z)) end
        end
    end
    -- índices: 1(-,-,-) 2(-,-,+) 3(-,+,-) 4(-,+,+) 5(+,-,-) 6(+,-,+) 7(+,+,-) 8(+,+,+)
    local edges = { {1,2},{3,4},{5,6},{7,8},{1,3},{2,4},{5,7},{6,8},{1,5},{2,6},{3,7},{4,8} }
    for _, e in ipairs(edges) do
        local a, bb = c[e[1]], c[e[2]]
        DrawLine(a.x, a.y, a.z, bb.x, bb.y, bb.z, r, g, b, 220)
    end
    -- el frente (donde se para el jugador) en amarillo
    DrawLine(c[1].x, c[1].y, c[1].z, c[6].x, c[6].y, c[6].z, 255, 210, 60, 230)
    DrawLine(c[2].x, c[2].y, c[2].z, c[5].x, c[5].y, c[5].z, 255, 210, 60, 230)
    local stand = KV.Off(f, vec3((f.min.x + f.max.x) / 2, f.min.y - 0.55, f.entity and (f.min.z + 0.02) or 0.02))
    DrawMarker(25, stand.x, stand.y, stand.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.55, 0.55, 0.55, 255, 210, 60, 150, false, false, 2, false, nil, nil, false)
end

local function camRay(dist, ignore)
    local from = GetGameplayCamCoord()
    local to = from + KV.RotDir(GetGameplayCamRot(2)) * dist
    local ray = StartExpensiveSynchronousShapeTestLosProbe(from.x, from.y, from.z, to.x, to.y, to.z, 1 + 16, ignore or 0, 4)
    local _, hit, pos = GetShapeTestResult(ray)
    return hit == 1, pos
end

local BLOCK = { 14, 15, 16, 17, 24, 25, 37, 44, 45, 47, 140, 141, 142, 143, 199, 200, 257, 263, 264 }
local function blockControls()
    for _, c in ipairs(BLOCK) do DisableControlAction(0, c, true) end
end

-- ==========================================================
--  colocar un prop (vista fantasma)
-- ==========================================================
local function placeGizmo(modelName, cfg)
    local hash = hashOf(modelName)
    if not IsModelInCdimage(hash) or not KV.LoadModel(hash) then
        Bridge.Notify(('El modelo "%s" no existe en el juego.'):format(tostring(modelName)), 'error')
        return nil
    end
    local ped = PlayerPedId()
    local pc = GetEntityCoords(ped)
    local ghost = CreateObject(hash, pc.x, pc.y, pc.z - 5.0, false, false, false)
    SetEntityAlpha(ghost, 175, false)
    SetEntityCollision(ghost, false, false)
    FreezeEntityPosition(ghost, true)
    SetModelAsNoLongerNeeded(hash)
    local mn = GetModelDimensions(hash)
    local maxDist = Config.Creator.placeDistance or 12.0

    local heading = GetGameplayCamRot(2).z
    if cfg and cfg.flip then heading = heading + 180.0 end
    local zoff = 0.0
    local sf = instructional({
        { 177, 'Cancelar' },
        { 47, 'Pegar al piso' },
        { 45, 'Mirar hacia mí' },
        { 173, 'Bajar' },
        { 172, 'Subir' },
        { 21, 'Giro fino' },
        { 241, 'Girar' },
        { 38, 'Colocar' },
    })

    local result
    while true do
        Wait(0)
        blockControls()
        DrawScaleformMovieFullscreen(sf, 255, 255, 255, 255, 0)
        local hit, pos = camRay(maxDist + 6.0, ghost)
        local valid = hit and #(GetEntityCoords(ped) - pos) <= maxDist
        if hit then SetEntityCoordsNoOffset(ghost, pos.x, pos.y, pos.z - mn.z + zoff, false, false, false) end

        local step = IsControlPressed(0, 21) and 1.0 or 7.5
        if IsDisabledControlJustPressed(0, 15) or IsControlJustPressed(0, 241) then heading = heading + step end
        if IsDisabledControlJustPressed(0, 14) or IsControlJustPressed(0, 242) then heading = heading - step end
        if IsControlPressed(0, 174) then heading = heading + 1.5 end
        if IsControlPressed(0, 175) then heading = heading - 1.5 end
        if IsControlPressed(0, 172) then zoff = math.min(2.5, zoff + 0.005) end
        if IsControlPressed(0, 173) then zoff = math.max(-1.0, zoff - 0.005) end
        if IsDisabledControlJustPressed(0, 47) then zoff = 0.0 end
        if IsDisabledControlJustPressed(0, 45) then
            heading = GetGameplayCamRot(2).z + ((cfg and cfg.flip) and 180.0 or 0.0)
        end
        SetEntityHeading(ghost, heading % 360.0)

        if hit then
            local f = KV.FrameFromEntity(ghost)
            if cfg and cfg.flip then
                f.heading = f.heading + 180.0
                f.min, f.max = vec3(-f.max.x, -f.max.y, f.min.z), vec3(-f.min.x, -f.min.y, f.max.z)
            end
            if valid then drawFrame(f, 60, 220, 120) else drawFrame(f, 255, 70, 60) end
        end

        if IsControlJustPressed(0, 38) or IsDisabledControlJustPressed(0, 24) then
            if valid then
                local c = GetEntityCoords(ghost)
                result = { x = c.x, y = c.y, z = c.z, h = GetEntityHeading(ghost), model = modelName }
                break
            else
                PlaySoundFrontend(-1, 'ERROR', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
            end
        end
        if IsControlJustPressed(0, 177) or IsDisabledControlJustPressed(0, 25) or IsDisabledControlJustPressed(0, 200) then
            break
        end
    end
    DeleteEntity(ghost)
    SetScaleformMovieAsNoLongerNeeded(sf)
    if result then PlaySoundFrontend(-1, 'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true) end
    return result
end

-- ==========================================================
--  marcar una máquina que es parte del mapa (sin prop)
-- ==========================================================
local function zoneGizmo()
    local counter = 0.92
    local sf = instructional({
        { 177, 'Cancelar' },
        { 173, 'Barra más baja' },
        { 172, 'Barra más alta' },
        { 38, 'Guardar aquí' },
    })
    local result
    Bridge.Notify('Párate frente a la máquina, mírala y presiona E.', 'inform')
    while true do
        Wait(0)
        DisableControlAction(0, 199, true)
        DisableControlAction(0, 200, true)
        DrawScaleformMovieFullscreen(sf, 255, 255, 255, 255, 0)
        local ped = PlayerPedId()
        local pc, h = GetEntityCoords(ped), GetEntityHeading(ped)
        if IsControlPressed(0, 172) then counter = math.min(2.5, counter + 0.004) end
        if IsControlPressed(0, 173) then counter = math.max(0.0, counter - 0.004) end
        local f = KV.FrameFromLocation({ stand = vec4(pc.x, pc.y, pc.z, h), counter = counter })
        drawFrame(f, 80, 170, 255)
        if IsControlJustPressed(0, 38) then
            result = { x = pc.x, y = pc.y, z = pc.z, h = h, counter = counter, kind = 'zone' }
            break
        end
        if IsControlJustPressed(0, 177) or IsDisabledControlJustPressed(0, 200) then break end
    end
    SetScaleformMovieAsNoLongerNeeded(sf)
    return result
end

-- ==========================================================
--  callbacks de la NUI del creador
-- ==========================================================
RegisterNUICallback('creator:close', function(_, cb)
    SetNuiFocus(false, false)
    creatorOpen, KV.creatorBusy = false, false
    cb({ ok = true })
end)

RegisterNUICallback('creator:items', function(_, cb)
    TriggerServerEvent('kev_vending:creator:items')
    cb({ ok = true })
end)

RegisterNetEvent('kev_vending:creator:items', function(items)
    SendNUIMessage({ action = 'creatorItems', items = items or {} })
end)

RegisterNUICallback('creator:save', function(data, cb)
    cb(Bridge.Call('creatorSave', data) or { ok = false })
end)

RegisterNUICallback('creator:delete', function(data, cb)
    cb(Bridge.Call('creatorDelete', data and data.id) or { ok = false })
end)

RegisterNUICallback('creator:removePlacement', function(data, cb)
    cb(Bridge.Call('creatorRemovePlacement', data and data.pid) or { ok = false })
end)

RegisterNUICallback('creator:checkModel', function(data, cb)
    local m = data and data.model
    if not m or m == '' then return cb({ ok = false }) end
    local h = hashOf(m)
    cb({ ok = IsModelInCdimage(h) and IsModelValid(h), hash = h })
end)

RegisterNUICallback('creator:tp', function(data, cb)
    cb({ ok = true })
    local pid = tonumber(data and data.pid)
    for _, pl in ipairs(KV.Placements or {}) do
        if pl.id == pid then
            hideCreator()
            creatorOpen, KV.creatorBusy = false, false
            local ped = PlayerPedId()
            local r = math.rad(pl.h or 0.0)
            local fwd = vec3(-math.sin(r), math.cos(r), 0.0)
            local pos = vec3(pl.x, pl.y, pl.z)
            if pl.kind ~= 'zone' then pos = pos - fwd * 1.4 + vec3(0.0, 0.0, 1.0) end
            DoScreenFadeOut(250) Wait(260)
            SetEntityCoords(ped, pos.x, pos.y, pos.z, false, false, false, false)
            SetEntityHeading(ped, pl.h or 0.0)
            Wait(300) DoScreenFadeIn(250)
            Bridge.Notify(('Estás en la máquina #%d. Usa /%s para volver al creador.'):format(pid, Config.Creator.command), 'inform')
            return
        end
    end
end)

RegisterNUICallback('creator:place', function(data, cb)
    cb({ ok = true })
    local id, mdl = data and data.id, data and data.model
    local cfg = KV.Machines[id] or data.cfg
    hideCreator()
    CreateThread(function()
        local res = placeGizmo(mdl, cfg)
        local extra = { tab = 'place' }
        if res then
            res.machine, res.kind = id, 'prop'
            local r = Bridge.Call('creatorPlace', res) or {}
            if r.ok then
                extra.placements, extra.msg, extra.msgType = r.placements, ('Máquina colocada (#%d).'):format(r.id), 'ok'
            else
                extra.msg, extra.msgType = r.reason == 'far' and 'Estás muy lejos de ese punto.' or 'No se pudo colocar.', 'err'
            end
        end
        showCreator(extra)
    end)
end)

RegisterNUICallback('creator:zone', function(data, cb)
    cb({ ok = true })
    local id = data and data.id
    hideCreator()
    CreateThread(function()
        local res = zoneGizmo()
        local extra = { tab = 'place' }
        if res then
            res.machine = id
            local r = Bridge.Call('creatorPlace', res) or {}
            if r.ok then
                extra.placements, extra.msg, extra.msgType = r.placements, ('Máquina del mapa marcada (#%d).'):format(r.id), 'ok'
            else
                extra.msg, extra.msgType = 'No se pudo guardar la zona.', 'err'
            end
        end
        showCreator(extra)
    end)
end)

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    if creatorOpen then SetNuiFocus(false, false) end
end)
