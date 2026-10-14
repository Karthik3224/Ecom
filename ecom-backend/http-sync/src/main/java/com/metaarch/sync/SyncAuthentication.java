package com.metaarch.sync;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class SyncAuthentication {
  private final SyncProperties properties;
  private final Clock clock;
  public SyncAuthentication(SyncProperties properties, Clock clock) {
    this.properties = properties;
    this.clock = clock;
  }
  public String sign(String source, String timestamp, byte[] body) {
    String key = properties.getKeys().get(source);
    if (key == null || key.length() < 32) throw new IllegalStateException("A source-specific sync key of at least 32 characters is required");
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      mac.update(("POST\n/internal/events\n" + source + "\n" + timestamp + "\n").getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(mac.doFinal(body));
    } catch (java.security.GeneralSecurityException ex) { throw new IllegalStateException(ex); }
  }
  public boolean verify(String source, String timestamp, String signature, byte[] body) {
    try {
      long seconds = Long.parseLong(timestamp);
      long now = clock.instant().getEpochSecond();
      if (seconds < now - 300 || seconds > now + 300) return false;
      return MessageDigest.isEqual(HexFormat.of().parseHex(sign(source, timestamp, body)),
        HexFormat.of().parseHex(signature));
    } catch (RuntimeException ex) { return false; }
  }
  public static String digest(byte[] body) {
    try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(body)); }
    catch (java.security.NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
  }
}
