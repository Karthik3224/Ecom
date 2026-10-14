package com.metaarch.catalog.image;
import java.net.URI; import java.util.*; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController public class ProductImageController {
 private final ProductImageService service; public ProductImageController(ProductImageService s){service=s;}
 @PostMapping("/api/v1/products/{productId}/images") ResponseEntity<ProductImageResponse> create(@PathVariable UUID productId,@Valid @RequestBody ProductImageRequest r){ProductImageResponse v=service.create(productId,r);return ResponseEntity.created(URI.create("/api/v1/images/"+v.id())).body(v);}
 @GetMapping("/api/v1/products/{productId}/images") List<ProductImageResponse> list(@PathVariable UUID productId){return service.list(productId);} @GetMapping("/api/v1/images/{id}") ProductImageResponse get(@PathVariable UUID id){return service.get(id);}
 @PutMapping("/api/v1/images/{id}") ProductImageResponse update(@PathVariable UUID id,@Valid @RequestBody ProductImageRequest r){return service.update(id,r);} @DeleteMapping("/api/v1/images/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable UUID id){service.delete(id);}
}
