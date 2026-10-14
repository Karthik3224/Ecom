package com.metaarch.orgaccess.customer;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class CustomerAccountController {
  private final CustomerAuthService customers;
  private final JdbcTemplate db;
  private final com.metaarch.orgaccess.security.JwtTokenProvider tokens;
  public CustomerAccountController(CustomerAuthService customers,JdbcTemplate db, com.metaarch.orgaccess.security.JwtTokenProvider tokens) { this.customers=customers;this.db=db;this.tokens=tokens; }
  @GetMapping("/api/customers/me") @PreAuthorize("hasRole('CUSTOMER')")
  public Object me(Authentication auth) { return customers.profile(auth.getName()); }
  @PutMapping("/api/customers/me/name") @PreAuthorize("hasRole('CUSTOMER')")
  public Object name(Authentication auth,@jakarta.validation.Valid @RequestBody Name input) {
    db.update("UPDATE app_customers SET full_name=? WHERE username=?",input.name().trim(),auth.getName());
    return customers.profile(auth.getName());
  }
  public record Name(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=120) String name) {}
  @PostMapping("/api/auth/logout")
  public Object logout(@RequestHeader("Authorization") String header) {
    db.update("INSERT IGNORE INTO revoked_tokens(token_hash,expires_at) VALUES(?,?)",hash(header.substring(7)),java.sql.Timestamp.from(tokens.getExpiration(header.substring(7))));
    return Map.of("message","Logged out.");
  }
  public static String hash(String token) {
    try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
    catch (Exception error) { throw new IllegalStateException(error); }
  }
}
