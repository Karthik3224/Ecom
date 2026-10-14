package com.metaarch.orgaccess.auth;

public record LoginRequest(
  String username,
  String password
) {
}
