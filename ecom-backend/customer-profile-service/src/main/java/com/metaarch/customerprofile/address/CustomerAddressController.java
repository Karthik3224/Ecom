package com.metaarch.customerprofile.address;
import java.util.*; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/profiles/me/addresses")
public class CustomerAddressController {
 private final CustomerAddressService service; public CustomerAddressController(CustomerAddressService s){service=s;}
 @GetMapping List<AddressResponse> list(Authentication a){return service.list(a.getName());}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) AddressResponse create(Authentication a,@Valid @RequestBody AddressRequest r){return service.create(a.getName(),r);}
 @PutMapping("/{id}") AddressResponse update(Authentication a,@PathVariable UUID id,@Valid @RequestBody AddressRequest r){return service.update(a.getName(),id,r);}
 @PatchMapping("/{id}/default") AddressResponse setDefault(Authentication a,@PathVariable UUID id){return service.setDefault(a.getName(),id);}
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(Authentication a,@PathVariable UUID id){service.delete(a.getName(),id);}
}
