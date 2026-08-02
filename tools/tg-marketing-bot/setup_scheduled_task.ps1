# Max Savdo — kunlik avtomatik post uchun Windows Task Scheduler vazifasini o'rnatadi.
#
# Ishlatish (PowerShell, oddiy foydalanuvchi huquqi yetarli):
#   powershell -ExecutionPolicy Bypass -File setup_scheduled_task.ps1
#   powershell -ExecutionPolicy Bypass -File setup_scheduled_task.ps1 -Time "09:00"
#
# Nima qiladi: har kuni belgilangan vaqtda "node scheduler.js" ni shu loyiha
# papkasida ishga tushiradigan vazifa yaratadi. scheduler.js o'zi mavzu tanlaydi,
# matn+ovoz+video generatsiya qiladi va @Maxsavdo_0 kanaliga to'g'ridan-to'g'ri joylaydi.
#
# Eslatma: standart holatda vazifa faqat siz tizimga kirgan (logged on) bo'lganda
# ishlaydi — parol so'ralmaydi. Agar kompyuter yoqilgan/kirilmagan holatda ham
# ishlashini xohlasangiz, pastdagi -RunWhetherLoggedOn izohini oching (u holda
# birinchi ishga tushirishda Windows parolingizni so'raydi).

param(
    [string]$Time = "09:00"
)

$ErrorActionPreference = "Stop"

$TaskName = "MaxSavdoDailyPost"
$ProjectDir = $PSScriptRoot
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
    Write-Error "node.exe topilmadi. Node.js o'rnatilganligini tekshiring."
    exit 1
}

$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "scheduler.js" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At $Time
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Eski '$TaskName' vazifasi o'chirildi, qayta o'rnatilmoqda..."
}

# Standart: faqat tizimga kirgan holatda ishlaydi, parol kerak emas.
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings `
    -Description "Max Savdo — har kuni avtomatik AI-post (matn+ovoz+video) @Maxsavdo_0 kanaliga" | Out-Null

# Kompyuter yoqilgan/kirilmagan holatda ham ishlashi kerak bo'lsa, yuqoridagi
# Register-ScheduledTask o'rniga quyidagini ishlating (parol so'raladi):
#
# $cred = Get-Credential -UserName $env:USERNAME -Message "Vazifa siz tizimga kirmagan holatda ham ishlashi uchun parolingizni kiriting"
# Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings `
#     -User $cred.UserName -Password $cred.GetNetworkCredential().Password -RunLevel Highest `
#     -Description "Max Savdo — har kuni avtomatik AI-post (matn+ovoz+video) @Maxsavdo_0 kanaliga" | Out-Null

Write-Host "Tayyor! '$TaskName' vazifasi har kuni soat $Time da ishga tushadi."
Write-Host "Tekshirish: Get-ScheduledTask -TaskName '$TaskName' | Get-ScheduledTaskInfo"
Write-Host "Hoziroq sinab ko'rish: Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "O'chirish: Unregister-ScheduledTask -TaskName '$TaskName'"
