b @echo off
setlocal
cd /d "%~dp0"

if "%~1"=="" goto :default
if /I "%~1"=="help" goto :usage
if /I "%~1"=="-h" goto :usage
if /I "%~1"=="--help" goto :usage

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-all-services.ps1" %*
exit /b %ERRORLEVEL%

:default
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-all-services.ps1" start all
exit /b %ERRORLEVEL%

:usage
echo Usage:
echo   run-all-services.bat start
echo   run-all-services.bat stop
echo   run-all-services.bat restart
echo   run-all-services.bat start all
echo   run-all-services.bat start catalog-service order-service
echo   run-all-services.bat stop payment-service
echo   run-all-services.bat restart Ecom-api-gateway
exit /b 0

endlocal
