param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$destinationPath=[IO.Path]::GetFullPath($Destination)
if (-not $destinationPath.StartsWith("$root\.local\",[StringComparison]::OrdinalIgnoreCase)) {throw 'Release staging must be under workspace .local'}
if(Test-Path -LiteralPath $destinationPath){throw 'Never overwrite a release'}
$services=@('Ecom-eureka-server','Ecom-config-server','Ecom-Org-access','customer-profile-service','catalog-service','inventory-service','cart-service','notification-service','fulfillment-service','payment-service','order-service','Ecom-api-gateway')
New-Item -ItemType Directory -Path "$destinationPath\backend" -ErrorAction Stop | Out-Null
$hashes=New-Object System.Collections.Generic.List[string]
foreach($service in $services) {
  $jars=@(Get-ChildItem "$root\ecom-backend\$service\target\*.jar")
  if($jars.Count -ne 1){throw "Expected one executable JAR for $service"}
  Copy-Item -LiteralPath $jars[0].FullName -Destination "$destinationPath\backend\$service.jar"
}
Copy-Item -LiteralPath "$root\ecom-frontend\dist" -Destination "$destinationPath\frontend" -Recurse
Copy-Item -LiteralPath "$PSScriptRoot\linux" -Destination "$destinationPath\linux" -Recurse
foreach($file in Get-ChildItem -LiteralPath $destinationPath -Recurse -File) {
  $relative=$file.FullName.Substring($destinationPath.Length+1).Replace('\','/')
  $hashes.Add((Get-FileHash -LiteralPath $file.FullName).Hash.ToLowerInvariant()+'  '+$relative)
}
[IO.File]::WriteAllLines("$destinationPath\SHA256SUMS",$hashes,(New-Object Text.UTF8Encoding($false)))
Write-Output "Pinned release: $destinationPath ($($hashes.Count) files). No source, dumps or runtime secrets copied."
