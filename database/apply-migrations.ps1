param(
  [string] $HostName = "localhost",
  [int] $Port = 5432,
  [string] $Database = "taskflow",
  [string] $Username = "postgres",
  [string] $MigrationsDir = (Join-Path $PSScriptRoot "migrations"),
  [string] $PsqlPath = "psql",
  [string] $Password = "1234"
)

$ErrorActionPreference = "Stop"

function Require-Command([string] $Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found. Install PostgreSQL client tools, add psql to PATH, or pass -PsqlPath to this script."
  }
}

function Invoke-PsqlFile([string] $FilePath) {
  Write-Host "Applying: $FilePath"
  & $PsqlPath -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $Username -d $Database -f $FilePath
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $FilePath"
    throw "psql failed applying '$FilePath' (exit code $LASTEXITCODE)."
  }
}

function Invoke-PsqlScalar([string] $Sql) {
  $result = & $PsqlPath -X -A -t -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $Username -d $Database -c $Sql
  if ($LASTEXITCODE -ne 0) { throw "psql failed executing scalar query (exit code $LASTEXITCODE)." }
  return ($result | Out-String).Trim()
}

Require-Command $PsqlPath

if (-not (Test-Path $MigrationsDir)) {
  throw "Migrations directory not found: $MigrationsDir"
}

Write-Host "Target DB: $Username@$HostName`:$Port/$Database"

# Convenience for this project: supply password to psql via env var.
# (This is intentionally hardcoded for the school project setup.)
$env:PGPASSWORD = $Password

# Ensure migration tracking table exists (idempotent).
Invoke-PsqlScalar @"
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"@ | Out-Null

$applied = @{}
$rows = Invoke-PsqlScalar "SELECT version FROM schema_migrations ORDER BY version;"
if ($rows) {
  foreach ($line in ($rows -split "`r?`n")) {
    $v = $line.Trim()
    if ($v) { $applied[$v] = $true }
  }
}

$files = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
if ($files.Count -eq 0) {
  Write-Host "No migration files found in $MigrationsDir"
  exit 0
}

foreach ($f in $files) {
  $version = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  if ($applied.ContainsKey($version)) {
    Write-Host "Skipping (already applied): $version"
    continue
  }

Invoke-PsqlFile $f.FullName

  # Safety net in case a migration forgets to insert into schema_migrations.
  Invoke-PsqlScalar "INSERT INTO schema_migrations(version) VALUES ('$version') ON CONFLICT (version) DO NOTHING;" | Out-Null
  Write-Host "Applied: $version"
}

Write-Host "Migrations complete."
