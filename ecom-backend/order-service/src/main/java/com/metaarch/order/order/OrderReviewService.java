package com.metaarch.order.order;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.order.exception.InvalidOrderStateException;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderReviewService {
  private final OrderRepository orders;
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  public OrderReviewService(OrderRepository orders, JdbcTemplate jdbc, ObjectMapper mapper) { this.orders=orders; this.jdbc=jdbc; this.mapper=mapper; }

  @PostConstruct
  void ensureReviewTable() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS order_reviews (id BINARY(16) NOT NULL PRIMARY KEY, order_id BINARY(16) NOT NULL UNIQUE, customer_id BINARY(16) NOT NULL, rating TINYINT NOT NULL, comment VARCHAR(1000) NOT NULL, photo_urls JSON NOT NULL, created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL, CONSTRAINT chk_order_reviews_rating CHECK (rating BETWEEN 1 AND 5), CONSTRAINT fk_order_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id))");
  }

  @Transactional
  public OrderReviewResponse save(UUID orderId, OrderReviewRequest request) {
    Order order=orders.findLockedById(orderId).orElseThrow(() -> new com.metaarch.order.exception.ResourceNotFoundException("Order not found"));
    // Fulfillment owns the delivery lifecycle. Some older orders retain CREATED
    // in the order row after their shipment is delivered, so do not block a
    // customer review on that stale parent status. Cancelled orders remain ineligible.
    if (order.getStatus()==OrderStatus.CANCELLED) throw new InvalidOrderStateException("A review can be submitted after delivery is complete.");
    List<String> photos=Optional.ofNullable(request.photoUrls()).orElse(List.of()).stream().filter(Objects::nonNull).map(String::trim).filter(value -> value.startsWith("data:image/") || value.startsWith("https://")).toList();
    if (photos.size()!=Optional.ofNullable(request.photoUrls()).orElse(List.of()).size()) throw new IllegalArgumentException("Review photos must be image data or HTTPS URLs.");
    String photoJson;
    try { photoJson=mapper.writeValueAsString(photos); } catch (Exception error) { throw new IllegalArgumentException("Review photos could not be saved.",error); }
    UUID id=UUID.randomUUID();
    String comment = Optional.ofNullable(request.comment()).orElse("").trim();
    jdbc.update("INSERT INTO order_reviews (id,order_id,customer_id,rating,comment,photo_urls,created_at,updated_at) VALUES (UUID_TO_BIN(?),UUID_TO_BIN(?),UUID_TO_BIN(?),?,?,?,NOW(6),NOW(6)) ON DUPLICATE KEY UPDATE rating=VALUES(rating),comment=VALUES(comment),photo_urls=VALUES(photo_urls),updated_at=NOW(6)",id.toString(),orderId.toString(),order.getCustomerId().toString(),request.rating(),comment,photoJson);
    return get(orderId).orElseThrow();
  }

  @Transactional(readOnly=true)
  public Optional<OrderReviewResponse> get(UUID orderId) {
    return jdbc.query("SELECT BIN_TO_UUID(id) id,BIN_TO_UUID(order_id) order_id,BIN_TO_UUID(customer_id) customer_id,rating,comment,photo_urls,created_at,updated_at FROM order_reviews WHERE order_id=UUID_TO_BIN(?)",(rs,row) -> {
      List<String> photos;
      try { photos=mapper.readValue(rs.getString("photo_urls"),new TypeReference<List<String>>(){}); } catch(Exception error) { photos=List.of(); }
      return new OrderReviewResponse(UUID.fromString(rs.getString("id")),UUID.fromString(rs.getString("order_id")),UUID.fromString(rs.getString("customer_id")),rs.getInt("rating"),rs.getString("comment"),photos,rs.getTimestamp("created_at").toInstant(),rs.getTimestamp("updated_at").toInstant());
    },orderId.toString()).stream().findFirst();
  }
}
