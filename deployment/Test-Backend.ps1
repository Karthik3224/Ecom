param([string]$LogPrefix='checkout-current')
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME=Join-Path $root 'ecom-backend\tools\java'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
$maven=Join-Path $root 'ecom-backend\tools\maven\bin\mvn.cmd'
$modules=@('http-sync','Ecom-eureka-server','Ecom-config-server','Ecom-api-gateway','Ecom-Org-access','customer-profile-service','catalog-service','inventory-service','cart-service','notification-service','fulfillment-service','payment-service','order-service','Ecom-Alerts')
$failed=@()
foreach($module in $modules) {
  $log=Join-Path $root ".local\$LogPrefix-$module.log"
  $old=$ErrorActionPreference
  try {
    $ErrorActionPreference='Continue'
    & $maven -f "$root\ecom-backend\$module\pom.xml" clean install *> $log
    $code=$LASTEXITCODE
  } finally {$ErrorActionPreference=$old}
  Write-Output "$module exit=$code log=$log"
  if($code -ne 0){$failed+=$module}
}
if($failed.Count){throw "Backend failed: $($failed -join ', ')"}
