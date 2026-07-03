/**
 * 通过 PowerShell 上传文件到 Vercel 并创建部署
 * 解决 Node.js fetch 到 api.vercel.com 的 ECONNRESET 问题
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawnSync } = require('child_process')

const PROJECT_ROOT = path.join(__dirname, '..')
const PROJECT_NAME = 'textbook-ing'

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', '.vercel', 'scripts',
  '.cache', 'coverage', 'tests',
])
const EXCLUDE_FILES = new Set([
  '.env', '.env.local', '.env.production',
  '.gitignore', '.npmrc', 'yarn.lock', 'pnpm-lock.yaml',
])
const MAX_FILE_SIZE = 10 * 1024 * 1024

function log(msg) {
  console.log(`[Deploy] ${msg}`)
}

function collectFiles(dir, base = '') {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue
      files.push(...collectFiles(fullPath, relPath))
    } else if (entry.isFile()) {
      if (EXCLUDE_FILES.has(entry.name)) continue
      if (entry.name.startsWith('.vercel-token')) continue
      const stat = fs.statSync(fullPath)
      if (stat.size > MAX_FILE_SIZE) continue
      files.push({ path: relPath, fullPath, size: stat.size })
    }
  }
  return files
}

function getFileSha(filePath) {
  const content = fs.readFileSync(filePath)
  return crypto.createHash('sha1').update(content).digest('hex')
}

async function main() {
  log('=== Vercel Deploy (PowerShell) ===')

  const token = fs.readFileSync(path.join(__dirname, '.vercel-token'), 'utf8').trim()
  log(`Token: ${token.substring(0, 15)}...${token.substring(token.length - 8)}`)

  // 收集文件
  log('Collecting project files...')
  const files = collectFiles(PROJECT_ROOT)
  log(`Total: ${files.length} files`)

  // 计算文件清单
  const manifest = files.map(f => ({
    sha: getFileSha(f.fullPath),
    size: f.size,
    file: f.path,
    fullPath: f.fullPath.replace(/\\/g, '/'),
  }))

  // 写入 manifest
  const manifestFile = path.join(__dirname, '.deploy-manifest.json')
  fs.writeFileSync(manifestFile, JSON.stringify(manifest))
  log(`Manifest written: ${manifestFile}`)

  // PowerShell 脚本（纯英文，避免编码问题）
  const psScript = path.join(__dirname, '.deploy-ps.ps1')
  const psContent = [
    '$ErrorActionPreference = "Stop"',
    '$token = "' + token + '"',
    '$projectName = "' + PROJECT_NAME + '"',
    '$manifestFile = "' + manifestFile.replace(/\\/g, '\\\\') + '"',
    '$manifest = Get-Content $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json',
    '',
    '# Get teamId',
    'try {',
    '  $teamsResp = Invoke-RestMethod -Uri "https://api.vercel.com/v2/teams" -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 60',
    '  $teamId = $teamsResp.teams[0].id',
    '  Write-Host "[Deploy] TeamId: $teamId"',
    '} catch {',
    '  $teamId = $null',
    '  Write-Host "[Deploy] Personal account (no team)"',
    '}',
    '$query = if ($teamId) { "?teamId=$teamId" } else { "" }',
    '',
    '# Check existing files',
    'Write-Host "[Deploy] Checking uploaded files..."',
    '$hashes = $manifest | ForEach-Object { $_.sha }',
    '$checkBody = @{ hashes = $hashes } | ConvertTo-Json',
    '$existing = @()',
    'try {',
    '  $checkResp = Invoke-RestMethod -Uri "https://api.vercel.com/v2/files/exists$query" -Method Post -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $checkBody -TimeoutSec 120',
    '  if ($checkResp.files) {',
    '    $existing = $checkResp.files | ForEach-Object { $_.sha }',
    '  }',
    '  Write-Host "[Deploy] Exists: $($existing.Count)/$($manifest.Count) files"',
    '} catch {',
    '  Write-Host "[Deploy] Check failed, will upload all: $_"',
    '}',
    '',
    '# Upload missing files',
    '$toUpload = $manifest | Where-Object { $_.sha -notin $existing }',
    'Write-Host "[Deploy] Need to upload: $($toUpload.Count) files"',
    '',
    '$uploaded = 0',
    'foreach ($f in $toUpload) {',
    '  $uploaded++',
    '  if ($uploaded % 10 -eq 0 -or $uploaded -eq $toUpload.Count) {',
    '    Write-Host "[Deploy] Progress: $uploaded/$($toUpload.Count)"',
    '  }',
    '  try {',
    '    $headers = @{',
    '      Authorization = "Bearer $token"',
    '      "Content-Type" = "application/octet-stream"',
    '      "x-vercel-digest" = $f.sha',
    '    }',
    '    $filePath = $f.fullPath -replace "/", "\\"',
    '    Invoke-RestMethod -Uri "https://api.vercel.com/v2/files$query" -Method Post -Headers $headers -InFile $filePath -TimeoutSec 120 | Out-Null',
    '  } catch {',
    '    Write-Host "[Deploy]   Upload failed: $($f.file) - $_"',
    '  }',
    '}',
    'Write-Host "[Deploy] File upload complete"',
    '',
    '# Create deployment',
    'Write-Host "[Deploy] Creating production deployment..."',
    '$filesArr = $manifest | ForEach-Object { @{ sha = $_.sha; size = $_.size; file = $_.file } }',
    '$deployBody = @{',
    '  name = $projectName',
    '  target = "production"',
    '  files = $filesArr',
    '  projectSettings = @{',
    '    framework = "vite"',
    '    buildCommand = "npm run build"',
    '    outputDirectory = "dist"',
    '    installCommand = "npm install"',
    '  }',
    '} | ConvertTo-Json -Depth 10',
    '',
    'try {',
    '  $deployResp = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments$query" -Method Post -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $deployBody -TimeoutSec 120',
    '  Write-Host "[Deploy] Deployment created: $($deployResp.id)"',
    '  Write-Host "[Deploy] Inspector: $($deployResp.inspectorUrl)"',
    '} catch {',
    '  Write-Host "[Deploy] Create deployment failed: $_"',
    '  exit 1',
    '}',
    '',
    '# Wait for deployment',
    'Write-Host "[Deploy] Waiting for deployment..."',
    '$depId = $deployResp.id',
    'for ($i = 1; $i -le 60; $i++) {',
    '  Start-Sleep -Seconds 5',
    '  try {',
    '    $status = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments/$depId$query" -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 60',
    '    $state = $status.readyState',
    '    Write-Host "[Deploy] Status ($i/60): $state"',
    '    if ($state -eq "READY") {',
    '      Write-Host "[Deploy] ========================================"',
    '      Write-Host "[Deploy] DEPLOY SUCCESS!"',
    '      Write-Host "[Deploy] URL: $($status.url)"',
    '      Write-Host "[Deploy] ========================================"',
    '      exit 0',
    '    } elseif ($state -eq "ERROR" -or $state -eq "CANCELED") {',
    '      Write-Host "[Deploy] FAILED: $state"',
    '      exit 1',
    '    }',
    '  } catch {',
    '    Write-Host "[Deploy] Status check failed: $_"',
    '  }',
    '}',
    'Write-Host "[Deploy] Timeout"',
    'exit 1',
  ].join('\r\n')

  // 写入 UTF-8 with BOM
  const bom = '\uFEFF'
  fs.writeFileSync(psScript, bom + psContent, 'utf8')
  log('PowerShell script generated, executing...')

  const result = spawnSync('powershell', [
    '-ExecutionPolicy', 'Bypass',
    '-File', psScript,
  ], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 600000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  if (result.stdout) {
    console.log(result.stdout)
  }
  if (result.stderr) {
    console.error(result.stderr)
  }

  // 清理
  try {
    fs.unlinkSync(manifestFile)
    fs.unlinkSync(psScript)
  } catch {}

  if (result.status === 0) {
    log('Deployment completed successfully!')
  } else {
    log(`Deployment failed, exit code: ${result.status}`)
    process.exit(1)
  }
}

main().catch(e => {
  log(`Failed: ${e.message}`)
  process.exit(1)
})
