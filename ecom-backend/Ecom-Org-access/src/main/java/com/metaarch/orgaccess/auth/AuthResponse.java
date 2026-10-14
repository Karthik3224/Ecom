package com.metaarch.orgaccess.auth;

import java.util.List;

public record AuthResponse(
  String token,
  String username,
  List<String> roles,
  long expiresInMillis
) {
}
