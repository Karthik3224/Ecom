package com.metaarch.cart.cart;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
  Optional<CartItem> findByIdAndCartId(UUID id, UUID cartId);
}
