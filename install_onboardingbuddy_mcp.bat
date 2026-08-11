@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$cfgPath = Join-Path $env:APPDATA 'Claude\claude_desktop_config.json';" ^
  "$cfgDir = Split-Path $cfgPath;" ^
  "if (-not (Test-Path $cfgDir)) { New-Item -ItemType Directory -Force -Path $cfgDir | Out-Null };" ^
  "if (Test-Path $cfgPath) { $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json } else { $cfg = [PSCustomObject]@{} };" ^
  "if (-not $cfg.mcpServers) { $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([PSCustomObject]@{}) };" ^
  "$entry = [PSCustomObject]@{ type = 'http'; url = 'https://onboardingbuddy.vercel.app/api/mcp'; headers = [PSCustomObject]@{ Authorization = 'Bearer EGLQ7rg8m7l-zjBFWXNvYVLjap7uRMhJ' } };" ^
  "$cfg.mcpServers | Add-Member -NotePropertyName onboardingbuddy -NotePropertyValue $entry -Force;" ^
  "$cfg | ConvertTo-Json -Depth 10 | Set-Content $cfgPath -Encoding utf8;" ^
  "Write-Host 'OnboardingBuddy MCP installed. Restart Claude Desktop to use it.'"
pause
