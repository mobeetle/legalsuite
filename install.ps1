#Requires -Version 5.1
<#
.SYNOPSIS
  Install legalsuite skills + commands (Windows).
.DESCRIPTION
  Mirrors install.sh: detects python3 (>=3.10) / node (>=20), honors
  -Runtime auto|python|node, offers winget installs when missing (-Yes accepts,
  -NoRuntimeInstall turns the offer into an error), stages skills/ + commands/
  with prefix support, backs up anything it overwrites.
.PARAMETER ConfigRoot
  Defaults to $env:OPENCODE_CONFIG dir or ~/.config/opencode.
.PARAMETER Prefix
  Skill-name prefix, default legal-. $env:LEGALSUITE_PREFIX overrides.
.PARAMETER Runtime
  auto|python|node. $env:LEGALSUITE_RUNTIME overrides.
.PARAMETER DryRun
  Print what would happen.
.PARAMETER AllCommands
  Install all six door alias commands beside the single `legal` router
  (default installs only the router and retires previously installed aliases).
.PARAMETER Yes
  Accept runtime installs non-interactively.
.PARAMETER NoRuntimeInstall
  Fail when the runtime is missing instead of offering to install it.
#>
param(
  [string]$ConfigRoot = "",
  [string]$Prefix = $env:LEGALSUITE_PREFIX,
  [ValidateSet("auto","python","node")][string]$Runtime = $(if ($env:LEGALSUITE_RUNTIME) { $env:LEGALSUITE_RUNTIME } else { "auto" }),
  [switch]$DryRun,
  [switch]$AllCommands,
  [switch]$Yes,
  [switch]$NoRuntimeInstall
)
$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-Python {
  try {
    $v = & python --version 2>&1
    if ($v -match 'Python (\d+)\.(\d+)') { return ([int]$Matches[1] * 100 + [int]$Matches[2]) -ge 310 }
  } catch {}
  try {
    $v = & python3 --version 2>&1
    if ($v -match 'Python (\d+)\.(\d+)') { return ([int]$Matches[1] * 100 + [int]$Matches[2]) -ge 310 }
  } catch {}
  return $false
}
function Test-Node {
  try { $m = & node -p 'process.versions.node.split(".")[0]' 2>$null; return ([int]$m) -ge 20 }
  catch { return $false }
}
function Offer-Install([string]$Kind) {
  if ($NoRuntimeInstall) { Write-Error "legalsuite: $Kind runtime required but missing (-NoRuntimeInstall)."; exit 2 }
  if ($DryRun) { Write-Host "would: install the $Kind runtime (dry run makes no changes)"; return }
  $cmd = if ($Kind -eq "python") { "winget install -e --id Python.Python.3.12" } else { "winget install -e --id OpenJS.NodeJS.LTS" }
  if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Error "legalsuite: no $Kind runtime found. Install from https://www.python.org/downloads/ or https://nodejs.org/, then re-run."
    exit 2
  }
  $ans = "y"
  if (-not $Yes) { $ans = Read-Host "No $Kind runtime found. Install it now via `$cmd`? [y/N]" }
  if ($ans -notmatch '^(y|yes)$') { Write-Error "Skipped $Kind install; aborting."; exit 2 }
  Write-Host "Running: $cmd"; Invoke-Expression $cmd
  if ($Kind -eq "python") { if (-not (Test-Python)) { Write-Error "python install did not take effect; re-open the terminal and re-run."; exit 2 } }
  else { if (-not (Test-Node)) { Write-Error "node install did not take effect; re-open the terminal and re-run."; exit 2 } }
}
$Selected = $Runtime
switch ($Runtime) {
  "python" { if (-not (Test-Python)) { Offer-Install "python" }; $Selected = "python" }
  "node"   { if (-not (Test-Node)) { Offer-Install "node" }; $Selected = "node" }
  default {
    if (Test-Python) { $Selected = "python" }
    elseif (Test-Node) { $Selected = "node" }
    else {
      $c = Read-Host "Neither python3 (>=3.10) nor node (>=20) found. Install which? [python/node/N]"
      switch -Regex ($c) { '^(p|python)$' { Offer-Install "python"; $Selected = "python" } '^(n|node)$' { Offer-Install "node"; $Selected = "node" } default { Write-Error "Aborting."; exit 2 } }
    }
  }
}
Write-Host "Runtime: $Selected"

if (-not $ConfigRoot) {
  if ($env:OPENCODE_CONFIG) { $ConfigRoot = Split-Path -Parent $env:OPENCODE_CONFIG } else { $ConfigRoot = "$HOME/.config/opencode" }
}
if (-not $Prefix) { $p = Read-Host "Skill name prefix [legal-]"; $Prefix = if ($p) { $p } else { "legal-" } }

# Gate: python verify when possible, else JS demos.
if ($Selected -eq "python") { & python "$Here/scripts/verify_suite.py"; if ($LASTEXITCODE) { exit $LASTEXITCODE } }
else {
  if (Get-Command python -ErrorAction SilentlyContinue) { & python "$Here/scripts/verify_suite.py"; if ($LASTEXITCODE) { exit $LASTEXITCODE } }
  foreach ($s in Get-ChildItem "$Here/skills/legal/scripts/*.js" -ErrorAction SilentlyContinue) {
    & node $s.FullName --demo | Out-Null; if ($LASTEXITCODE) { Write-Error "$($s.Name) --demo failed"; exit 2 }
  }
  Write-Host "JS demos ok."
}

$Stage = Join-Path ([IO.Path]::GetTempPath()) ("legalsuite-" + [IO.Path]::GetRandomFileName())
New-Item -ItemType Directory $Stage | Out-Null
try {
  Copy-Item "$Here/skills/*" "$Stage/skills" -Recurse -Force
  Copy-Item "$Here/commands" "$Stage/commands" -Recurse -Force
  if (Test-Path "$Here/playbooks") { Copy-Item "$Here/playbooks" "$Stage/playbooks" -Recurse -Force }
  foreach ($junk in Get-ChildItem $Stage -Recurse -Force -Include "__pycache__", ".DS_Store", "*.pyc" -ErrorAction SilentlyContinue) {
    Remove-Item $junk.FullName -Recurse -Force -ErrorAction SilentlyContinue
  }
  if (Get-Command python -ErrorAction SilentlyContinue) { & python "$Here/scripts/apply_prefix.py" --prefix $Prefix --root $Stage }
  else { & node "$Here/scripts/apply_prefix.js" --prefix $Prefix --root $Stage }

  if ($Selected -eq "node") {
    $names = @("display","doctext","ledger","load_playbook","matter","md2docx","migrate_state","preflight","redline","scan","structure","substance","trace","views")
    foreach ($md in Get-ChildItem $Stage -Recurse -Filter *.md) {
      $t = Get-Content $md.FullName -Raw -Encoding UTF8
      $t2 = $t
      foreach ($n in $names) { $t2 = $t2 -replace "\b${n}\.py\b", "${n}.js" }
      if ($t2 -ne $t) { Set-Content $md.FullName $t2 -Encoding UTF8NoBOM }
    }
    Write-Host "Node flavor: script references rewritten to *.js."
  }

  $RunTs = Get-Date -Format "yyyyMMddHHmmss"
  $BackupDir = Join-Path $ConfigRoot ".legalsuite-backups/$RunTs"
  function Backup([string]$Target) {
    if (-not (Test-Path $Target)) { return }
    if ($DryRun) { Write-Host "would: move $Target -> $BackupDir"; return }
    New-Item -ItemType Directory $BackupDir -Force | Out-Null
    Move-Item $Target (Join-Path $BackupDir (Split-Path $Target -Leaf)) -Force
    Write-Host "backed up $Target"
  }
  Write-Host "Prefix: $Prefix"
  if (-not $DryRun) { New-Item -ItemType Directory "$ConfigRoot/skills","$ConfigRoot/commands" -Force | Out-Null }

  foreach ($d in Get-ChildItem "$Stage/skills" -Directory) {
    Backup (Join-Path $ConfigRoot ("skills/" + $d.Name))
    if ($DryRun) { Write-Host "would: copy $($d.FullName) -> $ConfigRoot/skills/$($d.Name)" }
    else { Copy-Item $d.FullName (Join-Path $ConfigRoot "skills") -Recurse -Force }
  }
  # Playbooks: the policy layer the skills read from <config-root>/playbooks.
  if (Test-Path "$Stage/playbooks") {
    if (-not $DryRun) { New-Item -ItemType Directory "$ConfigRoot/playbooks" -Force | Out-Null }
    foreach ($p in Get-ChildItem "$Stage/playbooks" -Filter *.md) {
      if ($DryRun) { Write-Host "would: copy $($p.FullName) -> $ConfigRoot/playbooks/$($p.Name)" }
      else { Copy-Item $p.FullName (Join-Path $ConfigRoot "playbooks") -Force }
    }
  }
  $Stem = $Prefix.TrimEnd("-"); if (-not $Stem) { $Stem = "legal" }
  if ($AllCommands) {
    foreach ($f in Get-ChildItem "$Stage/commands" -Filter *.md) {
      Backup (Join-Path $ConfigRoot ("commands/" + $f.Name))
      if ($DryRun) { Write-Host "would: copy $($f.FullName) -> $ConfigRoot/commands/$($f.Name)" }
      else { Copy-Item $f.FullName (Join-Path $ConfigRoot "commands") -Force }
    }
  } else {
    foreach ($s in @("intake","research","review","drafting","dispute","project")) {
      Backup (Join-Path $ConfigRoot ("commands/$Stem-$s.md"))
    }
    Backup (Join-Path $ConfigRoot ("commands/$Stem.md"))
    if ($DryRun) { Write-Host "would: copy $Stage/commands/$Stem.md -> $ConfigRoot/commands/$Stem.md" }
    else { Copy-Item "$Stage/commands/$Stem.md" (Join-Path $ConfigRoot "commands") -Force }
  }
  if ($DryRun) { Write-Host "Dry run complete: no changes made ($ConfigRoot)." }
  else {
    # Verify what was installed: every staged skill present with the same file
    # count, router present, playbooks present. "Installed" is a claim until then.
    $n = 0
    foreach ($d in Get-ChildItem "$Stage/skills" -Directory) {
      $n++
      $dest = Join-Path $ConfigRoot ("skills/" + $d.Name)
      if (-not (Test-Path (Join-Path $dest "SKILL.md"))) { Write-Error "verify: missing $dest/SKILL.md"; exit 3 }
      $s = (Get-ChildItem $d.FullName -Recurse -File).Count
      $r = (Get-ChildItem $dest -Recurse -File).Count
      if ($s -ne $r) { Write-Error "verify: $($d.Name) has $s files, installed $r"; exit 3 }
    }
    if ($n -lt 6) { Write-Error "verify: expected 6 skills, installed $n"; exit 3 }
    $pb = @(Get-ChildItem (Join-Path $ConfigRoot "playbooks") -Filter *.md -ErrorAction SilentlyContinue).Count
    if ($pb -lt 1) { Write-Error "verify: no playbooks installed in $ConfigRoot/playbooks (the skills read them from there)"; exit 3 }
    if (-not (Test-Path (Join-Path $ConfigRoot ("commands/" + $Stem + ".md")))) { Write-Error "verify: router $Stem.md missing"; exit 3 }
    Write-Host "Verified: $n skills, router $Stem.md, $pb playbooks."
    Write-Host "Installed legalsuite into $ConfigRoot (skills + commands + playbooks, prefix $Prefix, runtime $Selected)."
  }
} finally { Remove-Item $Stage -Recurse -Force -ErrorAction SilentlyContinue }
