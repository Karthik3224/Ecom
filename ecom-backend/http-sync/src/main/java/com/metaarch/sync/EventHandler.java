package com.metaarch.sync;

import com.fasterxml.jackson.databind.JsonNode;

public interface EventHandler {
  String kind();
  String source();
  void handle(JsonNode payload);
  static <T> T decode(JsonNode payload, Class<T> type) {
    return new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules()
      .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
      .convertValue(payload, type);
  }
}
