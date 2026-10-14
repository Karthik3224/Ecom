package com.metaarch.alerts.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.metaarch.alerts.event.HouseCreatedEvent;

class HouseCreatedEventProcessorTest {

	private final HouseCreatedEventProcessor processor = new HouseCreatedEventProcessor();

	@Test
	void shouldProcessSupportedEvent() {
		HouseCreatedEvent event =
				new HouseCreatedEvent(UUID.randomUUID(), 1, 10L, "Main House", Instant.now());

		assertDoesNotThrow(() -> processor.process(event));
	}

	@Test
	void shouldRejectUnsupportedVersion() {
		HouseCreatedEvent event =
				new HouseCreatedEvent(UUID.randomUUID(), 2, 10L, "Main House", Instant.now());

		assertThrows(IllegalArgumentException.class, () -> processor.process(event));
	}

	@Test
	void shouldRejectEventWithoutIdentity() {
		HouseCreatedEvent event =
				new HouseCreatedEvent(null, 1, null, "Main House", Instant.now());

		assertThrows(IllegalArgumentException.class, () -> processor.process(event));
	}
}
