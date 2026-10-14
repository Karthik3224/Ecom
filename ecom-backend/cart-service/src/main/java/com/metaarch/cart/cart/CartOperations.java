package com.metaarch.cart.cart;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.cart.exception.*;
import com.metaarch.sync.SyncAuthentication;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartOperations {
  private final CartRepository carts;
  private final CartService service;
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  public CartOperations(CartRepository carts, CartService service, JdbcTemplate jdbc, ObjectMapper mapper) {
    this.carts=carts; this.service=service; this.jdbc=jdbc; this.mapper=mapper;
  }
  @Transactional
  public CartResponse add(UUID id, String key, AddCartItemRequest request) {
    if (key == null || !key.matches("[A-Za-z0-9_-]{16,128}")) throw new IllegalArgumentException("A valid Idempotency-Key is required");
    carts.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
    String hash;
    try { hash=SyncAuthentication.digest(mapper.writeValueAsBytes(request)); }
    catch (Exception ex) { throw new IllegalArgumentException("Invalid cart request", ex); }
    var previous=jdbc.queryForList("SELECT request_hash FROM cart_mutation_requests WHERE cart_id=? AND request_key=?", id.toString(), key);
    if (!previous.isEmpty()) {
      if (!hash.equals(previous.get(0).get("request_hash"))) throw new ConflictException("Idempotency-Key already used for different cart content");
      return service.get(id);
    }
    CartResponse result=service.addItem(id, request);
    jdbc.update("INSERT INTO cart_mutation_requests(cart_id,request_key,request_hash) VALUES (?,?,?)", id.toString(), key, hash);
    return result;
  }
  @Transactional
  public CartResponse claim(UUID id, CheckoutCartRequest request) {
    Cart cart=carts.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
    var previous=jdbc.queryForList("SELECT request_hash FROM cart_checkout_claims WHERE cart_id=?", id.toString());
    if (!previous.isEmpty()) {
      if (!request.requestHash().equals(previous.get(0).get("request_hash"))) throw new ConflictException("Cart is claimed by a different checkout");
      return CartResponse.from(cart);
    }
    if (cart.getStatus()!=CartStatus.ACTIVE) throw new InvalidCartStateException("Cart is not active");
    var expected=cart.getItems().stream().filter(i -> i.getStatus()==CartItemStatus.ACTIVE)
      .map(i -> new CheckoutCartRequest.Line(i.getProductId(),i.getVariantId(),i.getQuantity())).toList();
    if (!cart.getStoreId().equals(request.storeId()) || expected.isEmpty() || expected.size()!=request.items().size()
        || new HashSet<>(request.items()).size()!=request.items().size() || !new HashSet<>(expected).equals(new HashSet<>(request.items()))) {
      throw new ConflictException("Checkout items or store do not match the current cart");
    }
    jdbc.update("INSERT INTO cart_checkout_claims(cart_id,request_hash) VALUES (?,?)", id.toString(), request.requestHash());
    cart.setStatus(CartStatus.CHECKED_OUT);
    return CartResponse.from(cart);
  }
}
