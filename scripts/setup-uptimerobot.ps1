<#
.SYNOPSIS
  Создаёт 5 UptimeRobot-мониторов + Telegram-алерт для maxsavdo.

.DESCRIPTION
  Перед запуском:
    1. Зарегистрироваться на https://uptimerobot.com (бесплатно)
    2. My Settings → API Settings → Main API Key → скопировать
    3. Написать боту @UptimeRobot в Telegram → /start → он пришлёт chat_id
    4. В UptimeRobot: My Settings → Alert Contacts → Add → Telegram → вставить chat_id

  После этого запустить:
    pwsh scripts/setup-uptimerobot.ps1 -ApiKey "ur123456-xxxx" -TelegramChatId "1234567890"

.PARAMETER ApiKey
  UptimeRobot Main API Key (My Settings → API Settings).

.PARAMETER TelegramChatId
  Telegram chat_id полученный от @UptimeRobot бота.
#>
param(
  [Parameter(Mandatory)][string]$ApiKey,
  [Parameter(Mandatory)][string]$TelegramChatId
)

$ErrorActionPreference = 'Stop'

$BASE = 'https://api.uptimerobot.com/v2'

function Invoke-UR {
  param([string]$Endpoint, [hashtable]$Body)
  $Body['api_key'] = $ApiKey
  $Body['format']  = 'json'
  $response = Invoke-RestMethod -Uri "$BASE/$Endpoint" -Method POST -Body $Body -ContentType 'application/x-www-form-urlencoded'
  if ($response.stat -ne 'ok') {
    throw "UptimeRobot error [$Endpoint]: $($response | ConvertTo-Json -Depth 5)"
  }
  return $response
}

# ── 1. Создать Telegram alert contact ──────────────────────────────────────────
Write-Host "`n[1/2] Создаю Telegram alert contact (chat_id=$TelegramChatId)..." -ForegroundColor Cyan

$contact = Invoke-UR 'newAlertContact' @{
  type              = 20          # Telegram
  value             = $TelegramChatId
  friendly_name     = 'maxsavdo TG alerts'
}
$contactId = $contact.alertcontact.id
Write-Host "      ✅ Alert contact создан: id=$contactId" -ForegroundColor Green

# alert_contacts format: "id_threshold_recurrence" (0_0 = instant, no cooldown)
$alertParam = "${contactId}_0_0"

# ── 2. Мониторы ────────────────────────────────────────────────────────────────
$monitors = @(
  @{ name = 'maxsavdo API /health/live';  url = 'https://savdo-api-production.up.railway.app/api/v1/health/live' },
  @{ name = 'maxsavdo web-buyer';         url = 'https://savdo-builder-by-production.up.railway.app' },
  @{ name = 'maxsavdo web-seller';        url = 'https://savdo-builder-sl-production.up.railway.app' },
  @{ name = 'maxsavdo admin';             url = 'https://adminsb.up.railway.app' },
  @{ name = 'maxsavdo TMA';              url = 'https://telegram-app-production-7e95.up.railway.app' }
)

Write-Host "`n[2/2] Создаю $($monitors.Count) мониторов..." -ForegroundColor Cyan

foreach ($m in $monitors) {
  $result = Invoke-UR 'newMonitor' @{
    friendly_name   = $m.name
    url             = $m.url
    type            = 1       # HTTP(S)
    interval        = 300     # 5 минут
    alert_contacts  = $alertParam
  }
  $id = $result.monitor.id
  Write-Host "      ✅ $($m.name) → id=$id" -ForegroundColor Green
}

Write-Host "`n✅ Готово! Все 5 мониторов созданы. Проверь на https://uptimerobot.com/dashboard" -ForegroundColor Green
Write-Host "   При падении любого сервиса — алерт в Telegram через ~5 мин." -ForegroundColor Yellow
