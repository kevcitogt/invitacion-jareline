-- ==========================================================
--  BRIDGE SERVIDOR: dinero + inventario para cualquier server
-- ==========================================================
Bridge = {}

local FW, INV
local QBCore, ESX

local function started(res) return GetResourceState(res) == 'started' end
local function dbg(...) if Config.Debug then print('^3[kev_vending]^7', ...) end end

-- ---------- Detección ----------
local function detectFramework()
    if Config.Framework ~= 'auto' then return Config.Framework end
    if started('qbx_core') then return 'qbx' end
    if started('qb-core') then return 'qb' end
    if started('es_extended') then return 'esx' end
    return 'standalone'
end

local function detectInventory()
    if Config.Inventory ~= 'auto' then return Config.Inventory end
    local list = { 'ox_inventory', 'qs-inventory', 'codem-inventory', 'tgiann-inventory',
                   'origen_inventory', 'core_inventory', 'ps-inventory', 'lj-inventory', 'qb-inventory' }
    for _, r in ipairs(list) do if started(r) then return r end end
    return 'framework'
end

CreateThread(function()
    Wait(500)
    FW  = detectFramework()
    INV = detectInventory()
    if FW == 'qb' or FW == 'qbx' then
        local ok, obj = pcall(function() return exports['qb-core']:GetCoreObject() end)
        if ok then QBCore = obj end
    elseif FW == 'esx' then
        local ok, obj = pcall(function() return exports['es_extended']:getSharedObject() end)
        if ok then ESX = obj end
    end
    print(('^2[kev_vending]^7 Framework: ^5%s^7 | Inventario: ^5%s^7'):format(FW, INV))
end)

local function getPlayer(src)
    if FW == 'qbx' then
        local ok, p = pcall(function() return exports.qbx_core:GetPlayer(src) end)
        if ok and p then return p end
        return QBCore and QBCore.Functions.GetPlayer(src)
    elseif FW == 'qb' then
        return QBCore and QBCore.Functions.GetPlayer(src)
    elseif FW == 'esx' then
        return ESX and ESX.GetPlayerFromId(src)
    end
end

-- ==========================================================
--  STANDALONE: conecta aquí tu propio sistema de dinero/items
-- ==========================================================
local Standalone = {
    GetCash    = function(src) return 999 end,
    RemoveCash = function(src, amount) return true end,
    AddCash    = function(src, amount) return true end,
    AddItem    = function(src, item, count, meta) print(('[kev_vending] (standalone) %s recibe %sx %s'):format(src, count, item)) return true end,
}

-- ---------- Dinero (efectivo) ----------
function Bridge.GetCash(src)
    if FW == 'standalone' then return Standalone.GetCash(src) end
    local p = getPlayer(src); if not p then return 0 end
    if FW == 'esx' then
        if INV == 'ox_inventory' then
            return exports.ox_inventory:GetItemCount(src, 'money') or 0
        end
        return p.getMoney() or 0
    end
    return (p.PlayerData.money and p.PlayerData.money.cash) or 0
end

function Bridge.RemoveCash(src, amount)
    if FW == 'standalone' then return Standalone.RemoveCash(src, amount) end
    if Bridge.GetCash(src) < amount then return false end
    local p = getPlayer(src); if not p then return false end
    if FW == 'esx' then
        p.removeMoney(amount, 'vending')
        return true
    end
    return p.Functions.RemoveMoney('cash', amount, 'vending') ~= false
end

function Bridge.AddCash(src, amount)
    if amount <= 0 then return true end
    if FW == 'standalone' then return Standalone.AddCash(src, amount) end
    local p = getPlayer(src); if not p then return false end
    if FW == 'esx' then p.addMoney(amount, 'vending-refund') return true end
    p.Functions.AddMoney('cash', amount, 'vending-refund')
    return true
end

-- ---------- Inventario (con metadata: tamaño, hielo, azúcar...) ----------
function Bridge.AddItem(src, item, count, meta)
    count = count or 1
    local ok, r

    if INV == 'ox_inventory' then
        if not exports.ox_inventory:CanCarryItem(src, item, count, meta) then return false end
        local added = exports.ox_inventory:AddItem(src, item, count, meta)
        return added and true or false

    elseif INV == 'qs-inventory' then
        ok, r = pcall(function() return exports['qs-inventory']:AddItem(src, item, count, nil, meta) end)
        return ok and r ~= false

    elseif INV == 'codem-inventory' then
        ok, r = pcall(function() return exports['codem-inventory']:AddItem(src, item, count, nil, meta) end)
        return ok and r ~= false

    elseif INV == 'tgiann-inventory' then
        ok, r = pcall(function() return exports['tgiann-inventory']:AddItem(src, item, count, nil, meta) end)
        return ok and r ~= false

    elseif INV == 'origen_inventory' then
        ok, r = pcall(function() return exports.origen_inventory:AddItem(src, item, count, meta) end)
        if not ok then ok, r = pcall(function() return exports.origen_inventory:addItem(src, item, count, meta) end) end
        return ok and r ~= false

    elseif INV == 'core_inventory' then
        ok, r = pcall(function() return exports.core_inventory:addItem(src, item, count, meta) end)
        return ok and r ~= false

    elseif INV == 'qb-inventory' then
        -- qb-inventory nuevo (export) o viejo (Functions.AddItem)
        ok, r = pcall(function() return exports['qb-inventory']:AddItem(src, item, count, false, meta, 'vending') end)
        if ok then
            if r and QBCore then
                TriggerClientEvent('qb-inventory:client:ItemBox', src, QBCore.Shared.Items[item], 'add', count)
            end
            return r and true or false
        end
    end

    -- ps-inventory / lj-inventory / framework nativo
    if FW == 'standalone' then return Standalone.AddItem(src, item, count, meta) end
    local p = getPlayer(src); if not p then return false end
    if FW == 'esx' then
        if p.canCarryItem and not p.canCarryItem(item, count) then return false end
        p.addInventoryItem(item, count)
        return true
    end
    r = p.Functions.AddItem(item, count, false, meta)
    if r and QBCore and QBCore.Shared.Items[item] then
        TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[item], 'add')
    end
    return r and true or false
end

function Bridge.Notify(src, msg, typ)
    TriggerClientEvent('kev_vending:notify', src, msg, typ or 'inform')
end

-- ==========================================================
--  PERMISOS (creador de máquinas)
-- ==========================================================
function Bridge.IsAdmin(src)
    src = tonumber(src)
    if not src or src <= 0 then return false end
    local C = Config.Creator or {}
    if C.ace and IsPlayerAceAllowed(src, C.ace) then return true end
    if IsPlayerAceAllowed(src, 'command') then return true end
    local groups = C.groups or {}
    for _, g in ipairs(groups) do
        if IsPlayerAceAllowed(src, 'group.' .. g) then return true end
    end
    if (FW == 'qb' or FW == 'qbx') and QBCore and QBCore.Functions.HasPermission then
        for _, g in ipairs(groups) do
            local ok, r = pcall(QBCore.Functions.HasPermission, src, g)
            if ok and r then return true end
        end
    elseif FW == 'esx' then
        local p = getPlayer(src)
        local ok, g = pcall(function() return p and p.getGroup and p.getGroup() end)
        if ok and g then
            for _, x in ipairs(groups) do if g == x then return true end end
        end
    end
    return false
end

-- ==========================================================
--  LISTA DE ITEMS (buscador del creador)
-- ==========================================================
local IMAGE_PATHS = {
    ['ox_inventory']     = 'nui://ox_inventory/web/images/%s',
    ['qb-inventory']     = 'nui://qb-inventory/html/images/%s',
    ['ps-inventory']     = 'nui://ps-inventory/html/images/%s',
    ['lj-inventory']     = 'nui://lj-inventory/html/images/%s',
    ['qs-inventory']     = 'nui://qs-inventory/html/images/%s',
    ['codem-inventory']  = 'nui://codem-inventory/html/itemimages/%s',
    ['tgiann-inventory'] = 'nui://inventory_images/images/%s',
    ['origen_inventory'] = 'nui://origen_inventory/html/images/%s',
    ['core_inventory']   = 'nui://core_inventory/html/img/%s',
}

local function imagePath()
    if Config.ItemImages and Config.ItemImages ~= 'auto' then return Config.ItemImages end
    if IMAGE_PATHS[INV] then return IMAGE_PATHS[INV] end
    if FW == 'qb' or FW == 'qbx' then
        for _, r in ipairs({ 'qb-inventory', 'ps-inventory', 'lj-inventory' }) do
            if started(r) then return IMAGE_PATHS[r] end
        end
    end
    return nil
end

local function tryExport(res, fn)
    if not started(res) then return nil end
    local ok, r = pcall(function() return exports[res][fn](exports[res]) end)
    if ok and type(r) == 'table' and next(r) then return r end
    ok, r = pcall(function() return exports[res][fn]() end)
    if ok and type(r) == 'table' and next(r) then return r end
end

local function rawItemTable()
    local list
    if INV == 'ox_inventory' then list = tryExport('ox_inventory', 'Items')
    elseif INV == 'qs-inventory' then list = tryExport('qs-inventory', 'GetItemList')
    elseif INV == 'codem-inventory' then list = tryExport('codem-inventory', 'GetItemList')
    elseif INV == 'tgiann-inventory' then list = tryExport('tgiann-inventory', 'Items') or tryExport('tgiann-inventory', 'GetItemList')
    elseif INV == 'origen_inventory' then list = tryExport('origen_inventory', 'GetItems') or tryExport('origen_inventory', 'Items')
    end
    if list then return list end

    if (FW == 'qb' or FW == 'qbx') then
        if QBCore and QBCore.Shared and QBCore.Shared.Items and next(QBCore.Shared.Items) then return QBCore.Shared.Items end
        list = tryExport('ox_inventory', 'Items')
        if list then return list end
    elseif FW == 'esx' and ESX then
        local ok, r = pcall(function() return ESX.GetItems and ESX.GetItems() end)
        if ok and type(r) == 'table' and next(r) then return r end
        if type(ESX.Items) == 'table' and next(ESX.Items) then return ESX.Items end
        if started('oxmysql') then
            ok, r = pcall(function() return exports.oxmysql:query_async('SELECT name, label, weight FROM items') end)
            if ok and type(r) == 'table' and #r > 0 then return r end
        end
    end
    return nil
end

local itemCache, itemCacheTime = nil, 0
function Bridge.GetItems()
    if itemCache and (os.time() - itemCacheTime) < 60 then return itemCache end
    local raw = rawItemTable() or {}
    local path = imagePath()
    local out, seen = {}, {}

    local function push(name, v)
        if type(name) ~= 'string' or name == '' or seen[name] then return end
        seen[name] = true
        v = type(v) == 'table' and v or {}
        local img = v.image or (v.client and v.client.image)
        if type(img) ~= 'string' or img == '' then img = name .. '.png' end
        if not img:find('^https?://') and not img:find('^nui://') then
            if not img:find('%.%a+$') then img = img .. '.png' end
            img = path and path:format(img) or nil
        end
        local desc = v.description
        out[#out + 1] = {
            name   = name,
            label  = type(v.label) == 'string' and v.label or name,
            weight = tonumber(v.weight) or 0,
            image  = img,
            desc   = type(desc) == 'string' and desc:sub(1, 120) or nil,
        }
    end

    for k, v in pairs(raw) do
        if type(v) == 'table' then push(type(k) == 'string' and k or v.name, v) end
    end
    if #out == 0 then
        for _, v in ipairs(Config.FallbackItems or {}) do push(v.name, v) end
    end
    -- los items que ya usan las máquinas siempre aparecen
    for _, m in pairs(Config.Machines) do
        for _, p in ipairs(m.products or {}) do push(p.item, { label = p.label }) end
        for _, t in ipairs(m.taps or {}) do if t.item then push(t.item, { label = t.label }) end end
    end
    table.sort(out, function(a, b) return a.label:lower() < b.label:lower() end)
    itemCache, itemCacheTime = out, os.time()
    return out
end

function Bridge.Info() return FW, INV end
