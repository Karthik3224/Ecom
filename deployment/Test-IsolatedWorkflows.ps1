# Dot-sourced by Test-PinnedStack after all services are healthy; never run against live ports.
function Test-IsolatedWorkflows {
  $originalRows=@(& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT HEX(id),total_amount,handling_fee FROM `order-service`.orders ORDER BY id')
  if($LASTEXITCODE -ne 0 -or $originalRows.Count -lt 26){throw 'Existing order preservation baseline unavailable'}
  $customer=[guid]::NewGuid().ToString()
  function Encode-TokenPart($value) {
    [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($value | ConvertTo-Json -Compress -Depth 8))).TrimEnd('=').Replace('+','-').Replace('/','_')
  }
  $now=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $unsigned=(Encode-TokenPart @{alg='HS512';typ='JWT'})+'.'+(Encode-TokenPart @{sub='isolated-owner';iss='org-access';iat=$now;exp=($now+600);customerId=$customer;accountType='customer';roles=@('ROLE_CUSTOMER')})
  $hmac=New-Object Security.Cryptography.HMACSHA512
  try {$hmac.Key=[Text.Encoding]::UTF8.GetBytes($env:JWT_SECRET);$signature=[Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($unsigned))).TrimEnd('=').Replace('+','-').Replace('/','_')} finally {$hmac.Dispose()}
  $headers=@{Authorization="Bearer $unsigned.$signature";'Idempotency-Key'=[guid]::NewGuid().ToString()}
  $mappings=Invoke-RestMethod 'http://127.0.0.1:18089/api/v1/store-products' -TimeoutSec 10
  $selection=$null
  foreach($mapping in $mappings) {
    if(!$mapping.available){continue}
    $store=Invoke-RestMethod "http://127.0.0.1:18089/api/v1/stores/$($mapping.storeId)" -TimeoutSec 10
    if(!$store.active -or !$store.pickupEnabled -or $store.status -ne 'Active'){continue}
    $product=Invoke-RestMethod "http://127.0.0.1:18089/api/v1/products/$($mapping.productId)" -TimeoutSec 10
    $variant=@($product.variants | Where-Object {$_.active -and $_.price -gt 0}) | Select-Object -First 1
    if(!$variant -or $product.status -ne 'ACTIVE'){continue}
    $price=if($null -ne $mapping.priceOverride){[decimal]$mapping.priceOverride}else{[decimal]$variant.price}
    if($price -le 0){continue}
    $selection=@{Mapping=$mapping;Product=$product;Variant=$variant;Price=$price};break
  }
  if(!$selection){throw 'No eligible restored pickup fixture; do not invent catalog prices'}
  $cart=Invoke-RestMethod 'http://127.0.0.1:18091/api/v1/carts' -Headers $headers -Method Post -ContentType 'application/json' -Body (@{customerId=$customer;storeId=$selection.Mapping.storeId}|ConvertTo-Json) -TimeoutSec 10
  $item=@{productId=$selection.Product.id;variantId=$selection.Variant.id;productName=$selection.Product.name;quantity=1;unitPrice=$selection.Price}
  $cart=Invoke-RestMethod "http://127.0.0.1:18091/api/v1/carts/$($cart.id)/items" -Headers $headers -Method Post -ContentType 'application/json' -Body ($item|ConvertTo-Json) -TimeoutSec 10
  if([decimal]$cart.totalAmount -ne $selection.Price){throw 'Cart total mismatch'}
  Write-Output 'JWT-owned Cart create/add/read totals on isolated 18091: PASS'
  $payload=@{customerId=$customer;cartId=$cart.id;storeId=$selection.Mapping.storeId;items=@($item);deliveryMethod='pickup';fulfillmentType='pickup'}
  $body=$payload|ConvertTo-Json -Depth 8
  function Assert-HttpStatus([string]$url,[string]$method,[hashtable]$requestHeaders,[string]$requestBody,[int]$expected) {
    try {
      $parameters=@{Uri=$url;Method=$method;Headers=$requestHeaders;UseBasicParsing=$true;TimeoutSec=10}
      if($requestBody){$parameters.Body=$requestBody;$parameters.ContentType='application/json'}
      $response=Invoke-WebRequest @parameters;$actual=[int]$response.StatusCode
    } catch {
      if(!$_.Exception.Response){throw}
      $actual=[int]$_.Exception.Response.StatusCode
    }
    if($actual -ne $expected){throw "Unexpected status $actual expected $expected for $method"}
  }
  $beforeOrders=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT COUNT(*) FROM `order-service`.orders'
  $beforePayments=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT COUNT(*) FROM payment_service.payments'
  $foreignCustomer=[guid]::NewGuid().ToString()
  $foreignUnsigned=(Encode-TokenPart @{alg='HS512';typ='JWT'})+'.'+(Encode-TokenPart @{sub='isolated-stranger';iss='org-access';iat=$now;exp=($now+600);customerId=$foreignCustomer;accountType='customer';roles=@('ROLE_CUSTOMER')})
  $hmac=New-Object Security.Cryptography.HMACSHA512
  try{$hmac.Key=[Text.Encoding]::UTF8.GetBytes($env:JWT_SECRET);$foreignSignature=[Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($foreignUnsigned))).TrimEnd('=').Replace('+','-').Replace('/','_')}finally{$hmac.Dispose()}
  $foreignHeaders=@{Authorization="Bearer $foreignUnsigned.$foreignSignature";'Idempotency-Key'=[guid]::NewGuid().ToString()}
  $foreignCart=Invoke-RestMethod 'http://127.0.0.1:18091/api/v1/carts' -Headers $foreignHeaders -Method Post -ContentType 'application/json' -Body (@{customerId=$foreignCustomer;storeId=$selection.Mapping.storeId}|ConvertTo-Json) -TimeoutSec 10
  $foreignPayload=$payload.Clone();$foreignPayload.cartId=$foreignCart.id
  Assert-HttpStatus 'http://127.0.0.1:13311/api/v1/orders' 'Post' $headers ($foreignPayload|ConvertTo-Json -Depth 8) 403
  Assert-HttpStatus 'http://127.0.0.1:13311/api/v1/orders' 'Post' @{} $body 401
  Assert-HttpStatus "http://127.0.0.1:18091/api/v1/carts/$($cart.id)" 'Get' $foreignHeaders '' 403
  $afterOrders=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT COUNT(*) FROM `order-service`.orders'
  $afterPayments=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT COUNT(*) FROM payment_service.payments'
  if($beforeOrders -ne $afterOrders -or $beforePayments -ne $afterPayments){throw 'Rejected checkout created downstream records'}
  Write-Output 'Real Cart-to-Order ownership: foreign cart substitution 403, anonymous checkout 401, no orders/payments created: PASS'
  $paymentEntry=@($started | Where-Object {$_.Service[0] -eq 'payment-service'})[0]
  $orderEntry=@($started | Where-Object {$_.Service[0] -eq 'order-service'})[0]
  Stop-TestService $paymentEntry
  $first=Invoke-RestMethod 'http://127.0.0.1:13311/api/v1/orders' -Headers $headers -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 15
  $newHeaders=$headers.Clone();$newHeaders['Idempotency-Key']=[guid]::NewGuid().ToString()
  $newKeyRetry=Invoke-RestMethod 'http://127.0.0.1:13311/api/v1/orders' -Headers $newHeaders -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 15
  if($newKeyRetry.id -ne $first.id){throw 'Different retry key duplicated order'}
  $cartEntry=@($started | Where-Object {$_.Service[0] -eq 'cart-service'})[0]
  Restart-TestService $cartEntry
  Assert-HttpStatus "http://127.0.0.1:18091/api/v1/carts/$($cart.id)/items" 'Post' $newHeaders ($item|ConvertTo-Json) 409
  Assert-HttpStatus "http://127.0.0.1:13311/api/v1/orders/customer/$customer/history" 'Get' $headers '' 200
  Assert-HttpStatus "http://127.0.0.1:13311/api/v1/orders/$($first.id)" 'Get' $foreignHeaders '' 403
  Write-Output 'Different retry keys retain one order; Cart restart preserves checkout claim; claimed cart is immutable; owner history/cross-user denial: PASS'
  $deadline=(Get-Date).AddSeconds(20)
  $pending=0
  do {
    $pending=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT COUNT(*) FROM ``order-service``.sync_outbox WHERE aggregate_id='$($first.id)' AND target='payment-service' AND state='PENDING' AND attempts>0"
    if($LASTEXITCODE -ne 0){throw 'Isolated retry query failed'}
    if([int]$pending -lt 1){Start-Sleep -Seconds 1}
  } while([int]$pending -lt 1 -and (Get-Date) -lt $deadline)
  if([int]$pending -ne 1){throw 'Unavailable receiver did not leave durable pending work'}
  Restart-TestService $orderEntry
  $second=Invoke-RestMethod 'http://127.0.0.1:13311/api/v1/orders' -Headers $headers -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 15
  if($first.id -ne $second.id -or [decimal]$first.handlingFee -ne 5 -or [decimal]$first.totalAmount -ne ($selection.Price+5)){throw 'Order idempotency/pricing mismatch'}
  Write-Output 'Signed JWT order creation, duplicate retry after sender restart, authoritative price and handling fee: PASS'
  Restart-TestService $paymentEntry
  $deadline=(Get-Date).AddSeconds(45);$payment=$null
  do {
    try {$payment=Invoke-RestMethod "http://127.0.0.1:13314/api/v1/payments/order/$($first.id)" -Headers $headers -TimeoutSec 5} catch {}
    if(!$payment){Start-Sleep -Seconds 2}
  } while(!$payment -and (Get-Date) -lt $deadline)
  if(!$payment -or $payment.status -ne 'PENDING' -or [decimal]$payment.amount -ne [decimal]$first.totalAmount){throw 'Eventual pending payment synchronization failed'}
  Write-Output 'Authenticated HTTP order-to-pending-payment synchronization: PASS; no payment settlement fabricated'
  Restart-TestService $paymentEntry
  $recovered=Invoke-RestMethod "http://127.0.0.1:13314/api/v1/payments/order/$($first.id)" -Headers $headers -TimeoutSec 10
  if($recovered.id -ne $payment.id -or $recovered.status -ne 'PENDING'){throw 'Payment receiver restart lost or duplicated pending payment'}
  Write-Output 'Unavailable receiver retry and sender/receiver process restart recovery: PASS'
  $originalIds=@($originalRows | ForEach-Object {"UNHEX('"+($_ -split "`t")[0]+"')"}) -join ','
  $afterRows=@(& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT HEX(id),total_amount,handling_fee FROM ``order-service``.orders WHERE id IN ($originalIds) ORDER BY id")
  if($LASTEXITCODE -ne 0 -or ($originalRows -join "`n") -ne ($afterRows -join "`n")){throw 'Existing order totals changed'}
  Write-Output 'Existing order IDs, totals and handling fees unchanged: PASS'
}
