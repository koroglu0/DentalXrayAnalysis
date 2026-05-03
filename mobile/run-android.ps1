Set-Location $PSScriptRoot
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
npx expo run:android

# Build bittikten sonra ADB port forward kur (emülatör localhost:5000 -> host:5000)
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (Test-Path $adb) {
    & $adb forward tcp:5000 tcp:5000 | Out-Null
    Write-Host "✅ ADB forward tcp:5000 aktif"
}
