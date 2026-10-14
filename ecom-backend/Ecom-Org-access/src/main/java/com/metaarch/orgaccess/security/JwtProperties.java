package com.metaarch.orgaccess.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
  private String secret;
  private long expirationMillis = 3600000;
  private String issuer = "org-access";

  public String getSecret() {
    return secret;
  }

  public void setSecret(String secret) {
    this.secret = secret;
  }

  public long getExpirationMillis() {
    return expirationMillis;
  }

  public void setExpirationMillis(long expirationMillis) {
    this.expirationMillis = expirationMillis;
  }

  public String getIssuer() {
    return issuer;
  }

  public void setIssuer(String issuer) {
    this.issuer = issuer;
  }
}
