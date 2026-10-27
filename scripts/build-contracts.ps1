# Build release wasm for Soroban contract
Write-Host "Building Stellar Modular Developer contract..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\..\contracts\modular_developer"
stellar contract build
if ($LASTEXITCODE -eq 0) {
    Write-Host "Contract built successfully to target/wasm32-unknown-unknown/release/stellar_modular_developer.wasm" -ForegroundColor Green
} else {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
