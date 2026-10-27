# Deploy Stellar Modular Developer to Testnet
param(
    [string]$Identity = "deployer",
    [string]$Network = "testnet"
)

Write-Host "Deploying Stellar Modular Developer to $Network using $Identity..." -ForegroundColor Cyan

$wasmPath = "$PSScriptRoot\..\contracts\modular_developer\target\wasm32-unknown-unknown\release\stellar_modular_developer.wasm"
if (-not (Test-Path $wasmPath)) {
    Write-Host "Wasm binary not found. Running build first..." -ForegroundColor Yellow
    & "$PSScriptRoot\build-contracts.ps1"
}

stellar contract deploy --wasm $wasmPath --source $Identity --network $Network --alias stellar_modular_developer
