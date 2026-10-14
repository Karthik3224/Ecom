package com.metaarch.catalog.product;
import java.net.URI; import java.util.UUID; import com.metaarch.catalog.common.PageResponse; import jakarta.validation.Valid; import org.springframework.data.domain.*; import org.springframework.data.web.PageableDefault; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/products") public class ProductController {
 private final ProductService service; public ProductController(ProductService s){service=s;}
 @PostMapping ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest r){ProductResponse v=service.create(r);return ResponseEntity.created(URI.create("/api/v1/products/"+v.id())).body(v);}
 @GetMapping PageResponse<ProductResponse> list(@RequestParam(required=false) UUID categoryId,@RequestParam(required=false) ProductStatus status,@RequestParam(required=false) String search,@RequestParam(required=false) String q,@RequestParam(required=false) Boolean globalProduct,@PageableDefault(size=50,sort="name") Pageable pageable){return service.list(categoryId,status,search!=null?search:q,globalProduct,pageable);}
 @GetMapping("/{id}") ProductResponse get(@PathVariable UUID id){return service.get(id);} @PutMapping("/{id}") ProductResponse update(@PathVariable UUID id,@Valid @RequestBody ProductRequest r){return service.update(id,r);}
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable UUID id){service.delete(id);}
}
