package com.metaarch.catalog.category;
import java.net.URI; import java.util.*; import com.metaarch.catalog.common.PageResponse; import com.metaarch.catalog.product.*; import jakarta.validation.Valid; import org.springframework.data.domain.Pageable; import org.springframework.data.web.PageableDefault; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/categories") public class CategoryController {
 private final CategoryService service; private final ProductService products; public CategoryController(CategoryService s,ProductService p){service=s;products=p;}
 @PostMapping ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest r){CategoryResponse v=service.create(r);return ResponseEntity.created(URI.create("/api/v1/categories/"+v.id())).body(v);}
 @GetMapping List<CategoryResponse> list(){return service.list();} @GetMapping("/{id}") CategoryResponse get(@PathVariable UUID id){return service.get(id);} @PutMapping("/{id}") CategoryResponse update(@PathVariable UUID id,@Valid @RequestBody CategoryRequest r){return service.update(id,r);}
 @GetMapping("/{id}/products") PageResponse<ProductResponse> products(@PathVariable UUID id,@RequestParam(required=false) ProductStatus status,@RequestParam(required=false) String search,@RequestParam(required=false) String q,@PageableDefault(size=50,sort="name") Pageable pageable){service.get(id);return products.list(id,status,search!=null?search:q,null,pageable);}
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable UUID id){service.delete(id);}
}
