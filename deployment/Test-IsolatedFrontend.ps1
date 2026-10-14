$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$base='http://127.0.0.1:5184'
$fixture=Get-Content "$root\.local\isolated-login-fixture.json" -Raw | ConvertFrom-Json
function Request-Status($path,$method,$headers,$body) {
  try {
    $arguments=@{Uri="$base$path";Method=$method;Headers=$headers;UseBasicParsing=$true;TimeoutSec=15}
    if($body){$arguments.Body=$body;$arguments.ContentType='application/json'}
    return [int](Invoke-WebRequest @arguments).StatusCode
  } catch {if(!$_.Exception.Response){throw};return [int]$_.Exception.Response.StatusCode}
}
if((Request-Status '/login' 'Get' @{} '') -ne 200){throw 'Isolated frontend HTML failed'}
$bad=@{email=$fixture.email;password='InvalidLocalPassword9'} | ConvertTo-Json
if((Request-Status '/org-access/api/auth/customer/login' 'Post' @{} $bad) -ne 401){throw 'Invalid credentials were not rejected'}
$session=Invoke-RestMethod "$base/org-access/api/auth/customer/login" -Method Post -ContentType 'application/json' -Body (@{email=$fixture.email;password='LocalQaOnly9'}|ConvertTo-Json) -TimeoutSec 15
if($session.user.id -ne $fixture.customerId -or !$session.token){throw 'Login returned incorrect test identity'}
$headers=@{Authorization="Bearer $($session.token)";'Idempotency-Key'=[guid]::NewGuid().ToString();Origin=$base}
$identity=Invoke-RestMethod "$base/org-access/api/customers/me" -Headers $headers -TimeoutSec 15
if($identity.id -ne $fixture.customerId){throw 'Signed login identity mismatch'}
Write-Output 'Frontend proxy login: invalid credentials 401; actual Auth login/customer identity: PASS'
$catalogPage=Invoke-RestMethod "$base/catalog/api/v1/products?status=ACTIVE" -TimeoutSec 15
$catalog=if($catalogPage.content){@($catalogPage.content)}else{@($catalogPage)}
if(!$catalog.Count -or !$catalog[0].id){throw 'Catalog browsing returned no products'}
$stores=Invoke-RestMethod "$base/catalog/api/v1/stores" -TimeoutSec 15
$store=@($stores | Where-Object {$_.active})[0]
$cart=Invoke-RestMethod "$base/cart-api/api/v1/carts" -Headers $headers -Method Post -ContentType 'application/json' -Body (@{customerId=$fixture.customerId;storeId=$store.id}|ConvertTo-Json) -TimeoutSec 15
if($cart.customerId -ne $fixture.customerId){throw 'Cart owner mismatch'}
if((Request-Status "/cart-api/api/v1/carts/$($cart.id)" 'Get' @{} '') -ne 401){throw 'Anonymous cart read accepted'}
$history=Invoke-RestMethod "$base/order-api/api/v1/orders/customer/$($fixture.customerId)/history" -Headers $headers -TimeoutSec 15
$capabilities=Invoke-RestMethod "$base/payments/api/v1/payments/capabilities" -Headers $headers -TimeoutSec 15
if($capabilities.processingEnabled -ne $false){throw 'Real payments unexpectedly enabled'}
Write-Output 'Frontend proxy catalog/store selection, owned Cart, anonymous denial, owner history and disabled payments: PASS'
$logout=Request-Status '/org-access/api/auth/logout' 'Post' $headers '{}'
if($logout -notin @(200,204)){throw 'Auth logout failed'}
$revokedAuth=Request-Status '/org-access/api/customers/me' 'Get' $headers ''
if($revokedAuth -notin @(401,403)){throw 'Auth accepted revoked session'}
$revokedCart=Request-Status "/cart-api/api/v1/carts/$($cart.id)" 'Get' $headers ''
if($revokedCart -eq 200){Write-Output 'FAIL/BLOCKER: Auth revokes logout token, but Cart still accepts its signed JWT until expiry; resource-server revocation parity is missing';$securityFailed=$true}
elseif($revokedCart -in @(401,403)){Write-Output 'Revoked-token Cart denial: PASS'}
else {throw "Unexpected revoked-token Cart status $revokedCart"}
Write-Output 'Browser UI clicks/rendering/console/guest UI merge: NOT VERIFIED - no connected browser automation available'
if($securityFailed){exit 2}
