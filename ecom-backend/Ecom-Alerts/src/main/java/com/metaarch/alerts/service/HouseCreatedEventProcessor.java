package com.metaarch.alerts.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.metaarch.alerts.event.HouseCreatedEvent;

@Service
public class HouseCreatedEventProcessor {

	private static final Logger LOGGER = LoggerFactory.getLogger(HouseCreatedEventProcessor.class);
	private static final int SUPPORTED_VERSION = 1;

	public void process(HouseCreatedEvent event) {
		if (event == null || event.eventId() == null || event.houseId() == null) {
			throw new IllegalArgumentException("HouseCreatedEvent requires eventId and houseId");
		}
		if (event.version() != SUPPORTED_VERSION) {
			throw new IllegalArgumentException(
					"Unsupported HouseCreatedEvent version: " + event.version());
		}

		// Add house-specific alert persistence or notification routing here.
		// Keeping this operation idempotent by eventId is important because
		// Kafka consumers provide at-least-once delivery.
		LOGGER.info(
				"Processed HouseCreatedEvent eventId={} houseId={} houseName={} occurredAt={}",
				event.eventId(), event.houseId(), event.houseName(), event.occurredAt());
	}
}
