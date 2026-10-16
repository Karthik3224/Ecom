package com.metaarch.order.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.order.exception.ConflictException;
import com.metaarch.sync.PublicApiSecurity;
import com.metaarch.sync.SyncAuthentication;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Durable preparation only; no public creation route until inventory recovery is qualified. */
@Service
public class CheckoutGroups {
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final OrderService orders;

  public CheckoutGroups(JdbcTemplate jdbc, ObjectMapper mapper, OrderService orders) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.orders = orders;
  }

  public record Child(String storeId, UUID cartId, UUID orderId, String state, BigDecimal handlingFee,
      BigDecimal subtotal, BigDecimal deliveryFee, BigDecimal total, OrderStatus orderStatus, PaymentStatus paymentStatus) { }
  public record Result(UUID id, UUID customerId, String state, BigDecimal aggregateTotal, List<Child> children, boolean recoveryRequired) { }

  @Transactional
  public Result prepare(String key, List<CreateOrderRequest> requests) {
    UUID owner = authenticatedCustomer();
    if (key == null || !key.matches("[A-Za-z0-9_-]{16,128}")) throw new IllegalArgumentException("Invalid checkout retry key");
    if (requests == null || requests.isEmpty()) throw new IllegalArgumentException("Checkout requires store carts");
    Set<String> stores = new HashSet<>();
    Set<UUID> carts = new HashSet<>();
    for (CreateOrderRequest request : requests) {
      if (request == null || !owner.equals(request.customerId())) throw new AccessDeniedException("Checkout customer mismatch");
      if (request.storeId() == null || request.storeId().isBlank() || !request.storeId().equals(request.storeId().trim())
          || request.cartId() == null || !stores.add(request.storeId()) || !carts.add(request.cartId())) {
        throw new IllegalArgumentException("Checkout requires one distinct cart per store");
      }
      if (request.items() == null || request.items().isEmpty()) throw new IllegalArgumentException("Empty store order");
      if (request.paymentStatus() != null && request.paymentStatus() != PaymentStatus.PENDING) {
        throw new IllegalArgumentException("Checkout cannot confirm payment");
      }
    }
    String payload;
    try {
      payload = mapper.writeValueAsString(requests.stream().sorted(Comparator.comparing(CreateOrderRequest::storeId)).toList());
    } catch (Exception failure) {
      throw new IllegalArgumentException("Cannot serialize checkout", failure);
    }
    String hash = SyncAuthentication.digest(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    jdbc.queryForObject("SELECT id FROM sync_receiver_lock WHERE id=1 FOR UPDATE", Integer.class);
    var existing = jdbc.queryForList("SELECT id,request_hash FROM checkout_groups WHERE customer_id=? AND request_key=?", owner.toString(), key);
    if (!existing.isEmpty()) {
      if (!hash.equals(existing.get(0).get("request_hash"))) throw new ConflictException("Checkout retry content changed");
      return get(UUID.fromString(existing.get(0).get("id").toString()));
    }
    for (UUID cart : carts) {
      if (!jdbc.queryForList("SELECT checkout_id FROM checkout_children WHERE cart_id=?", cart.toString()).isEmpty()) {
        throw new ConflictException("Cart belongs to an existing checkout");
      }
    }
    UUID id = UUID.randomUUID();
    jdbc.update("INSERT INTO checkout_groups(id,customer_id,request_key,request_hash,request_payload,state,handling_policy) VALUES (?,?,?,?,?,?,?)",
        id.toString(), owner.toString(), key, hash, payload, "PREPARED", "FIVE_PER_STORE");
    for (CreateOrderRequest request : requests) {
      UUID reservation=UUID.nameUUIDFromBytes((id+":"+request.storeId()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
      jdbc.update("INSERT INTO checkout_children(checkout_id,store_id,cart_id,state,handling_fee,reservation_id) VALUES (?,?,?,?,?,?)",
          id.toString(), request.storeId(), request.cartId().toString(), "PREPARED", new BigDecimal("5.00"),reservation.toString());
    }
    audit(id, null, CheckoutGroupState.PREPARED, owner);
    return get(id);
  }

  @Transactional(readOnly = true)
  public Result getByKey(String key) {
    UUID owner=authenticatedCustomer();
    var ids=jdbc.queryForList("SELECT id FROM checkout_groups WHERE customer_id=? AND request_key=?",String.class,owner.toString(),key);
    if(ids.isEmpty()) throw new com.metaarch.order.exception.ResourceNotFoundException("Checkout attempt not found");
    return get(UUID.fromString(ids.getFirst()));
  }

  @Transactional(readOnly = true)
  public Result getByCart(UUID cartId) {
    UUID owner = authenticatedCustomer();
    var ids = jdbc.queryForList("SELECT g.id FROM checkout_groups g JOIN checkout_children c ON c.checkout_id=g.id WHERE g.customer_id=? AND c.cart_id=?",
        String.class, owner.toString(), cartId.toString());
    if (ids.isEmpty()) throw new com.metaarch.order.exception.ResourceNotFoundException("Checkout attempt not found");
    return get(UUID.fromString(ids.getFirst()));
  }

  @Transactional(readOnly = true)
  public Result get(UUID id) {
    UUID owner = authenticatedCustomer();
    var rows = jdbc.queryForList("SELECT customer_id,state,aggregate_total FROM checkout_groups WHERE id=? AND customer_id=?", id.toString(), owner.toString());
    if (rows.isEmpty()) throw new AccessDeniedException("Checkout unavailable to this customer");
    var row = rows.get(0);
    var children = jdbc.query("SELECT store_id,cart_id,order_id,state,handling_fee FROM checkout_children WHERE checkout_id=? ORDER BY store_id",
        (rs, index) -> {
          UUID orderId=rs.getString(3)==null?null:UUID.fromString(rs.getString(3));
          OrderResponse order=orderId==null?null:orders.get(orderId);
          if(order!=null && (!owner.equals(order.customerId()) || !rs.getString(1).equals(order.storeId()))) throw new AccessDeniedException("Checkout child ownership mismatch");
          return new Child(rs.getString(1),UUID.fromString(rs.getString(2)),orderId,rs.getString(4),rs.getBigDecimal(5),
              order==null?null:order.totalAmount().subtract(order.deliveryCharge()).subtract(order.handlingFee()),
              order==null?null:order.deliveryCharge(),order==null?null:order.totalAmount(),order==null?null:order.status(),order==null?null:order.paymentStatus());
        }, id.toString());
    boolean recovery=jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox WHERE aggregate_id=? AND target='inventory-service' AND state='DEAD'",Integer.class,id.toString())>0;
    return new Result(id, owner, row.get("state").toString(), (BigDecimal) row.get("aggregate_total"), children,recovery);
  }

  private UUID authenticatedCustomer() {
    var authentication = SecurityContextHolder.getContext().getAuthentication();
    if (!(authentication instanceof JwtAuthenticationToken jwt) || !jwt.isAuthenticated()) throw new AccessDeniedException("Verified customer required");
    try {
      UUID owner = UUID.fromString(jwt.getToken().getClaimAsString("customerId"));
      if (!PublicApiSecurity.owns(owner)) throw new AccessDeniedException("Verified customer required");
      return owner;
    } catch (IllegalArgumentException | NullPointerException failure) {
      throw new AccessDeniedException("Verified customer required");
    }
  }

  private void audit(UUID id, CheckoutGroupState previous, CheckoutGroupState next, UUID actor) {
    jdbc.update("INSERT INTO checkout_audit(id,checkout_id,previous_state,next_state,actor) VALUES (?,?,?,?,?)",
        UUID.randomUUID().toString(), id.toString(), previous == null ? null : previous.name(), next.name(), actor.toString());
  }
}
