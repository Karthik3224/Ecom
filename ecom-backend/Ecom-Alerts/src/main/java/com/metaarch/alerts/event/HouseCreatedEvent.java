package com.metaarch.alerts.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Alerts service's local representation of the house-created integration
 * contract. It deliberately does not depend on the producer's Java classes.
 */
public record HouseCreatedEvent(
		UUID eventId,
		int version,
		Long houseId,
		String houseName,
		Instant occurredAt) {
}
