$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath -and (Test-Path -LiteralPath 'D:\node.exe')) { $nodePath = 'D:\node.exe' }
if (-not $nodePath) { throw 'Install Node.js before starting AgriEdge.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot '.next\standalone\server.js'))) { throw 'Run npm run build first.' }
Start-Process -FilePath $nodePath -ArgumentList 'scripts/supervisor.mjs' -WorkingDirectory $projectRoot -WindowStyle Hidden
Start-Process 'http://127.0.0.1:3001/en'
