package com.metaarch.alerts.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import com.metaarch.alerts.event.HouseCreatedEvent;

@Service
public class HouseCreatedConsumer {

	private static final Logger LOGGER = LoggerFactory.getLogger(HouseCreatedConsumer.class);

	private final HouseCreatedEventProcessor eventProcessor;

	public HouseCreatedConsumer(HouseCreatedEventProcessor eventProcessor) {
		this.eventProcessor = eventProcessor;
	}

	@KafkaListener(
			topics = "${app.kafka.house-created-topic}",
			groupId = "${spring.kafka.consumer.house-created-group-id}",
			containerFactory = "houseCreatedKafkaListenerContainerFactory")
	public void consume(HouseCreatedEvent event,  Acknowledgment acknowledgment) {
		LOGGER.info(
				"Received HouseCreatedEvent eventId={} houseId={}",
				event.eventId(), event.houseId());
	
		eventProcessor.process(event);
		acknowledgment.acknowledge();
	}
}
