package com.metaarch.sync;

import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import static org.assertj.core.api.Assertions.*;

class PublicApiSecurityTest {
  @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }
  void caller(UUID id, String type, String role) {
    var jwt = Jwt.withTokenValue("test").header("alg","HS256").subject("caller")
      .claim("customerId",id.toString()).claim("accountType",type).build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority(role))));
  }
  @Test void ownershipAndAdminRolesFailClosed() {
    UUID owner=UUID.randomUUID();
    assertThat(PublicApiSecurity.owns(owner)).isFalse();
    caller(owner,"customer","ROLE_ADMIN");
    assertThat(PublicApiSecurity.administrator()).isFalse();
    assertThat(PublicApiSecurity.owns(owner)).isTrue();
    assertThat(PublicApiSecurity.owns(UUID.randomUUID())).isFalse();
    caller(owner,"staff","ROLE_STORE_MANAGER");
    assertThat(PublicApiSecurity.administrator()).isFalse();
    caller(owner,"staff","ROLE_GLOBAL_ADMIN");
    assertThat(PublicApiSecurity.administrator()).isTrue();
  }
  @Test void weakSecretAndBlankIssuerAreRejected() {
    var config=new PublicApiSecurity();
    assertThatThrownBy(() -> config.publicJwtDecoder("short","org-access")).isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> config.publicJwtDecoder("x".repeat(64),"")).isInstanceOf(IllegalArgumentException.class);
  }
  @Test void signedJwtRequiresCorrectKeyIssuerAndExpiry() throws Exception {
    String secret="x".repeat(64);
    var claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().subject("owner").issuer("org-access")
      .expirationTime(java.util.Date.from(java.time.Instant.now().plusSeconds(60))).build();
    var token = new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS512),claims);
    token.sign(new com.nimbusds.jose.crypto.MACSigner(secret));
    assertThat(new PublicApiSecurity().publicJwtDecoder(secret,"org-access").decode(token.serialize()).getSubject()).isEqualTo("owner");
    assertThatThrownBy(() -> new PublicApiSecurity().publicJwtDecoder("y".repeat(64),"org-access").decode(token.serialize()))
      .isInstanceOf(org.springframework.security.oauth2.jwt.JwtException.class);
    assertThatThrownBy(() -> new PublicApiSecurity().publicJwtDecoder(secret,"another-issuer").decode(token.serialize()))
      .isInstanceOf(org.springframework.security.oauth2.jwt.JwtException.class);
    var expired = new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS512),
      new com.nimbusds.jwt.JWTClaimsSet.Builder().subject("owner").issuer("org-access")
        .expirationTime(java.util.Date.from(java.time.Instant.now().minusSeconds(120))).build());
    expired.sign(new com.nimbusds.jose.crypto.MACSigner(secret));
    assertThatThrownBy(() -> new PublicApiSecurity().publicJwtDecoder(secret,"org-access").decode(expired.serialize()))
      .isInstanceOf(org.springframework.security.oauth2.jwt.JwtException.class);
  }
}
