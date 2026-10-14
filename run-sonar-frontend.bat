@echo off
setlocal
set "SCANNER=%~dp0.local\sonar\sonar-scanner-8.1.0.6389-windows-x64\bin\sonar-scanner.bat"
if not exist "%SCANNER%" (
  echo SonarScanner was not found at %SCANNER%
  exit /b 1
)
if "%SONAR_TOKEN%"=="" (
  set /p SONAR_TOKEN=Paste SonarQube token:
)
cd /d "%~dp0ecom-frontend"
"%SCANNER%" -Dsonar.host.url=http://localhost:9000 -Dsonar.token=%SONAR_TOKEN%
endlocal
