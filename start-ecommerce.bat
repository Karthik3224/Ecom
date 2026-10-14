@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%ecom-backend"

if not exist "%BACKEND%\run-all-services.ps1" (
    echo ERROR: Backend launcher not found:
    echo        %BACKEND%\run-all-services.ps1
    exit /b 1
)

echo Starting Ecom application through the existing launcher...
echo MySQL: localhost:3306
echo Core synchronization: HTTP; Kafka is not required. Legacy alerts are excluded.
echo Frontend: 127.0.0.1:5173
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; ^
   $mysqlUsername=Read-Host 'MySQL username (press Enter for root)'; ^
   if ([string]::IsNullOrWhiteSpace($mysqlUsername)) { $mysqlUsername='root' }; ^
   $mysqlSecure=Read-Host 'MySQL password' -AsSecureString; ^
   $mysqlPtr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlSecure); ^
   $mysqlPassword=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($mysqlPtr); ^
   [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($mysqlPtr); ^
   $smtpUsername=Read-Host 'SMTP username'; ^
   $smtpSecure=Read-Host 'SMTP app password' -AsSecureString; ^
   $smtpPtr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpSecure); ^
   $smtpPassword=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($smtpPtr); ^
   [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($smtpPtr); ^
   $mapsKey=Read-Host 'Google Maps API key'; ^
   $jwtFile=Join-Path '%ROOT%' '.local\secrets\jwt.secret'; ^
   if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET) -and (Test-Path $jwtFile)) { $env:JWT_SECRET=(Get-Content $jwtFile -Raw).Trim() }; ^
   if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) { ^
     New-Item -ItemType Directory -Force -Path (Split-Path $jwtFile) | Out-Null; ^
     $jwtBytes=New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Fill($jwtBytes); ^
     $env:JWT_SECRET=[Convert]::ToBase64String($jwtBytes); ^
     Set-Content -LiteralPath $jwtFile -Value $env:JWT_SECRET -NoNewline -Encoding ASCII ^
   }; ^
   $env:MYSQL_HOST='localhost'; ^
   $env:MYSQL_PORT='3306'; ^
   $env:MYSQL_USERNAME=$mysqlUsername; ^
   $env:MYSQL_PASSWORD=$mysqlPassword; ^
   $env:SMTP_HOST='smtp.gmail.com'; ^
   $env:SMTP_PORT='587'; ^
   $env:SMTP_USERNAME=$smtpUsername; ^
   $env:SMTP_FROM=$smtpUsername; ^
   $env:SMTP_PASSWORD=$smtpPassword; ^
   $env:SMTP_AUTH='true'; ^
   $env:SMTP_STARTTLS='true'; ^
   $env:SMTP_STARTTLS_ENABLE='true'; ^
   $env:SMTP_SSL='false'; ^
   $env:VITE_GOOGLE_MAPS_API_KEY=$mapsKey; ^
   if (-not (Test-NetConnection localhost -Port 3306 -InformationLevel Quiet)) { throw 'MySQL Server is required and must be running on localhost:3306.' }; ^
   & '%BACKEND%\run-all-services.ps1' start -MysqlPort 3306 -StartFrontend; ^
   exit $LASTEXITCODE"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo Application startup failed. Check the launcher output and .local\logs.
)

endlocal & exit /b %EXIT_CODE%
