param(
  [string] $HostName = "localhost",
  [int] $Port = 5432,
  [string] $Database = "taskflow",
  [string] $Username = "postgres",
  [string] $SeedFile = (Join-Path $PSScriptRoot "seed.sql"),
  [string] $SeedsDir = (Join-Path $PSScriptRoot "seeds"),
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
  Write-Host "Seeding: $FilePath"
  & $PsqlPath -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $Username -d $Database -f $FilePath
  if ($LASTEXITCODE -ne 0) { throw "psql failed running seed '$FilePath' (exit code $LASTEXITCODE)." }
}

Require-Command $PsqlPath

Write-Host "Target DB: $Username@$HostName`:$Port/$Database"

# Convenience for this project: supply password to psql via env var.
# (This is intentionally hardcoded for the school project setup.)
$env:PGPASSWORD = $Password

if (Test-Path $SeedFile) {
  Invoke-PsqlFile $SeedFile
} elseif (Test-Path $SeedsDir) {
  $files = Get-ChildItem -Path $SeedsDir -Filter "*.sql" | Sort-Object Name
  if ($files.Count -eq 0) {
    Write-Host "No seed files found in $SeedsDir"
    exit 0
  }

  foreach ($f in $files) {
    Invoke-PsqlFile $f.FullName
  }
} else {
  throw "Seed file not found: $SeedFile (and seeds directory not found: $SeedsDir)"
}

Write-Host "Seeding complete."
