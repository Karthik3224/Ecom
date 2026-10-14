package com.metaarch.order.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.order.exception.ConflictException;
import com.metaarch.sync.SyncAuthentication;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderCreation {
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final OrderService orders;
  private final OrderRepository repository;
  private final CheckoutCartClient cart;

  public OrderCreation(JdbcTemplate jdbc, ObjectMapper mapper, OrderService orders, OrderRepository repository, CheckoutCartClient cart) {
    this.jdbc = jdbc; this.mapper = mapper; this.orders = orders; this.repository=repository; this.cart=cart;
  }

  @Transactional
  public OrderResponse create(String key, CreateOrderRequest request) {
    if (key == null || !key.matches("[A-Za-z0-9_-]{16,128}")) {
      throw new IllegalArgumentException("Idempotency-Key must contain 16-128 letters, digits, underscores or hyphens");
    }
    String hash;
    try { hash = SyncAuthentication.digest(mapper.writeValueAsBytes(request)); }
    catch (Exception ex) { throw new IllegalArgumentException("Cannot serialize order request", ex); }
    // Share the existing database lock so concurrent requests across processes
    // cannot create two orders before the unique request record is committed.
    jdbc.queryForObject("SELECT id FROM sync_receiver_lock WHERE id=1 FOR UPDATE", Integer.class);
    var previous = jdbc.queryForList("SELECT request_hash,order_id FROM order_creation_requests WHERE customer_id=? AND request_key=?",
        request.customerId().toString(), key);
    if (!previous.isEmpty()) {
      var row = previous.get(0);
      if (!hash.equals(row.get("request_hash"))) throw new ConflictException("Idempotency-Key was already used for a different order request");
      return orders.get(UUID.fromString(row.get("order_id").toString()));
    }
    // Different browser retry keys must not create a second order for one cart.
    var existing=repository.findByCartId(request.cartId());
    if (!existing.isEmpty()) {
      if (existing.size()!=1 || !request.customerId().equals(existing.get(0).getCustomerId())) throw new ConflictException("Cart has already been ordered");
      var hashes=jdbc.queryForList("SELECT request_hash FROM order_creation_requests WHERE order_id=?", existing.get(0).getId().toString());
      if (hashes.size()!=1 || !hash.equals(hashes.get(0).get("request_hash"))) throw new ConflictException("Cart has already been ordered with different content");
      return orders.get(existing.get(0).getId());
    }
    cart.claim(request, hash);
    OrderResponse response = orders.create(request);
    jdbc.update("INSERT INTO order_creation_requests(customer_id,request_key,request_hash,order_id) VALUES (?,?,?,?)",
        request.customerId().toString(), key, hash, response.id().toString());
    return response;
  }
}
