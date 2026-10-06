fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'kev_vending'
author 'kev y lizar'
description 'Creador de máquinas de bebidas: vending con monedas de Q1, café, fuente de sodas, granizadas y jugos'
version '3.0.0'

shared_scripts {
    'config.lua',
}

client_scripts {
    'bridge/client.lua',
    'client/main.lua',
    'client/creator.lua',
}

server_scripts {
    'bridge/server.lua',
    'server/main.lua',
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/creator.css',
    'html/app.js',
    'html/creator.js',
    -- 'html/img/*.png', -- descomenta si usas fotos reales de la moneda
}
