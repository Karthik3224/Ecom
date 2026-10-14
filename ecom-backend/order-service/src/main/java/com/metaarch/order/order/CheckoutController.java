package com.metaarch.order.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/checkouts")
@ConditionalOnProperty(name="checkout.multi-store.enabled",havingValue="true")
public class CheckoutController {
  private final CheckoutCoordinator coordinator;
  private final CheckoutGroups groups;
  private final com.fasterxml.jackson.databind.ObjectMapper mapper;
  private final jakarta.validation.Validator validator;
  public CheckoutController(CheckoutCoordinator coordinator,CheckoutGroups groups,com.fasterxml.jackson.databind.ObjectMapper mapper,jakarta.validation.Validator validator){this.coordinator=coordinator;this.groups=groups;this.mapper=mapper;this.validator=validator;}
  public record Request(@NotEmpty List<com.fasterxml.jackson.databind.JsonNode> stores){
    @com.fasterxml.jackson.annotation.JsonAnySetter public void unsupported(String key,Object value){throw new IllegalArgumentException("Unsupported checkout field: "+key);}
  }
  @PostMapping public CheckoutGroups.Result submit(@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody Request request){
    var stores=new ArrayList<CreateOrderRequest>();
    for(var node:request.stores()) {
      CreateOrderRequest store;
      try { store=mapper.readerFor(CreateOrderRequest.class).with(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).readValue(node); }
      catch(java.io.IOException failure){throw new IllegalArgumentException("Unsupported or malformed store checkout fields",failure);}
      if(store==null || !validator.validate(store).isEmpty()) throw new IllegalArgumentException("Invalid store checkout request");
      stores.add(store);
    }
    return coordinator.submit(key,stores);
  }
  @GetMapping("/{id}") public CheckoutGroups.Result get(@PathVariable UUID id){return groups.get(id);}
  @GetMapping("/by-key/{key}") public CheckoutGroups.Result byKey(@PathVariable String key){return groups.getByKey(key);}
  @PostMapping("/{id}/retry") public CheckoutGroups.Result retry(@PathVariable UUID id){return coordinator.retry(id);}
}
