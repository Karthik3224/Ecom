package com.metaarch.alerts.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.metaarch.alerts.event.BookingAlertEvent;

@Service
public class BookingAlertConsumer {
  private static final Logger LOGGER = LoggerFactory.getLogger(BookingAlertConsumer.class);

  private final EmailSenderService emailSenderService;

  public BookingAlertConsumer(EmailSenderService emailSenderService) {
    this.emailSenderService = emailSenderService;
  }

  @KafkaListener(
    topics = "${app.kafka.booking-alert-topic}",
    groupId = "${spring.kafka.consumer.group-id}",
    containerFactory = "kafkaListenerContainerFactory"
  )
  public void consume(BookingAlertEvent event) {
    LOGGER.info("Received booking alert event for bookingId={} email={}", event.getBookingId(), event.getEmailTo());
    emailSenderService.sendBookingAlert(event);
  }
}
