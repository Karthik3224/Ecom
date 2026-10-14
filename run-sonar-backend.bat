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
cd /d "%~dp0ecom-backend"
for /d %%i in (*) do (
  if exist "%%i\pom.xml" (
    echo Building %%i
    pushd "%%i"
    call mvn clean package -DskipTests
    if errorlevel 1 exit /b 1
    popd
  )
)
"%SCANNER%" -Dsonar.host.url=http://localhost:9000 -Dsonar.token=%SONAR_TOKEN%
endlocal
