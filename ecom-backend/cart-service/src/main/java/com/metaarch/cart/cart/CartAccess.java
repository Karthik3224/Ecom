package com.metaarch.cart.cart;

import com.metaarch.sync.PublicApiSecurity;
import java.util.UUID;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component("cartAccess")
@Import(PublicApiSecurity.class)
public class CartAccess {
  private final CartRepository carts;
  public CartAccess(CartRepository carts) { this.carts = carts; }
  public boolean customer(UUID id) { return PublicApiSecurity.owns(id); }
  public boolean owner(UUID id) {
    return carts.findById(id).map(cart -> PublicApiSecurity.owns(cart.getCustomerId())).orElse(false);
  }
}
