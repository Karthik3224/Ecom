package com.metaarch.orgaccess.auth;

import java.util.List;

public record AuthValidationResponse(
  String username,
  List<String> roles,
  boolean authenticated
) {
}
