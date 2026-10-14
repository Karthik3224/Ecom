package com.metaarch.inventory.movement;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class StockMovementRecorderTest {
  @Test void tiesAdvanceAtDatabasePrecision() {
    Instant previous = Instant.parse("2026-10-10T10:00:00.123456Z");
    assertEquals(previous.plusNanos(1000), StockMovementRecorder.nextTimestamp(previous.plusNanos(100), previous));
  }
  @Test void persistedHistoryWinsAfterRestartOrClockRollback() {
    Instant previous = Instant.parse("2026-10-10T10:00:00Z");
    assertEquals(previous.plusNanos(1000), StockMovementRecorder.nextTimestamp(previous.minusSeconds(60), previous));
  }
  @Test void firstMovementAndForwardClockUseMicroseconds() {
    Instant now = Instant.parse("2026-10-10T10:00:00.123456789Z");
    assertEquals(Instant.parse("2026-10-10T10:00:00.123456Z"), StockMovementRecorder.nextTimestamp(now, null));
    assertEquals(StockMovementRecorder.nextTimestamp(now, null), StockMovementRecorder.nextTimestamp(now, now.minusSeconds(1)));
  }
}
