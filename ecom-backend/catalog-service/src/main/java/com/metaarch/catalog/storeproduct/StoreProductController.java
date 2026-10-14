package com.metaarch.catalog.storeproduct;
import java.net.URI; import java.util.*; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/store-products") public class StoreProductController {
 private final StoreProductService service; public StoreProductController(StoreProductService s){service=s;}
 @PostMapping ResponseEntity<StoreProductResponse> create(@Valid @RequestBody StoreProductRequest r){StoreProductResponse v=service.create(r);return ResponseEntity.created(URI.create("/api/v1/store-products/"+v.id())).body(v);}
 @GetMapping List<StoreProductResponse> list(@RequestParam(required=false) String storeId,@RequestParam(required=false) UUID productId){return service.list(storeId,productId);} @GetMapping("/{id}") StoreProductResponse get(@PathVariable UUID id){return service.get(id);}
 @PutMapping("/{id}") StoreProductResponse update(@PathVariable UUID id,@Valid @RequestBody StoreProductRequest r){return service.update(id,r);} @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable UUID id){service.delete(id);}
}
