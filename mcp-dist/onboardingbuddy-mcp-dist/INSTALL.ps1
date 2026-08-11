# OnboardingBuddy - Claude Desktop connector setup
# Detects CPU architecture, installs the matching Node.js LTS if missing, then wires up the connector.

Write-Host "============================================================"
Write-Host "  OnboardingBuddy - Claude Desktop connector"
Write-Host "============================================================"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host " [1/3] Node.js not found - installing the right version for this PC..."

    $arch = switch ($env:PROCESSOR_ARCHITECTURE) {
        "AMD64"  { "x64" }
        "ARM64"  { "arm64" }
        "x86"    { "x86" }
        default  { "x64" }
    }

    $ver = "22.14.0"
    $msi = "node-v$ver-$arch.msi"
    $url = "https://nodejs.org/dist/v$ver/$msi"
    $out = Join-Path $env:TEMP $msi

    Write-Host "      Detected: $arch - downloading $msi ..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
    } catch {
        Write-Host " [X] Download failed. Check your internet connection, or install manually from https://nodejs.org"
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host "      Installing (you may see a Windows permission prompt - click Yes)..."
    Start-Process msiexec.exe -ArgumentList "/i", "`"$out`"", "/qn", "/norestart" -Wait

    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host " [X] Node.js installed but not found on PATH yet. Close this window, reopen PowerShell, and run INSTALL.ps1 again."
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "      Node.js installed."
} else {
    Write-Host " [1/3] Node.js already installed - skipping."
}

Write-Host " [2/3] Checking the connector files..."
$nodeExe = (Get-Command node).Source
if (-not (Test-Path (Join-Path $PSScriptRoot "node_modules\@modelcontextprotocol\sdk"))) {
    Write-Host " [X] This folder is missing required files (node_modules). Re-download and re-extract the ZIP, then try again."
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "      OK - everything needed is already in this folder."

Write-Host " [3/3] Registering the connector with Claude Desktop..."
& $nodeExe (Join-Path $PSScriptRoot "install.mjs")
if ($LASTEXITCODE -ne 0) {
    Write-Host " [X] Registration failed."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host " DONE. Fully quit Claude Desktop (system tray icon, bottom-right - not"
Write-Host " just the window) and reopen it, then ask it:"
Write-Host "       `"Give me today's help ticket report`""
Read-Host "Press Enter to exit"
