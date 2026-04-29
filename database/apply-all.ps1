param(
  [string] $HostName = "localhost",
  [int] $Port = 5432,
  [string] $Database = "taskflow",
  [string] $Username = "postgres",
  [string] $PsqlPath = "psql",
  [string] $Password = "1234"
)

$ErrorActionPreference = "Stop"

Write-Host "Applying migrations..."
& (Join-Path $PSScriptRoot "apply-migrations.ps1") -HostName $HostName -Port $Port -Database $Database -Username $Username -PsqlPath $PsqlPath -Password $Password

Write-Host ""
Write-Host "Applying seeds..."
& (Join-Path $PSScriptRoot "apply-seeds.ps1") -HostName $HostName -Port $Port -Database $Database -Username $Username -PsqlPath $PsqlPath -Password $Password
