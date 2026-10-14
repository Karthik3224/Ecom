package com.metaarch.cart.cart;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class CartSchemaReadiness implements ApplicationRunner {
  private final JdbcTemplate jdbc;
  public CartSchemaReadiness(JdbcTemplate jdbc) { this.jdbc=jdbc; }
  @Override public void run(ApplicationArguments args) {
    if (jdbc.queryForObject("SELECT COUNT(*) FROM cart_write_lock WHERE id=1",Integer.class)!=1) throw new IllegalStateException("Cart V4 lock seed required");
    jdbc.queryForList("SELECT cart_id,request_key,request_hash,created_at FROM cart_mutation_requests WHERE 1=0");
    jdbc.queryForList("SELECT cart_id,request_hash,created_at FROM cart_checkout_claims WHERE 1=0");
  }
}
