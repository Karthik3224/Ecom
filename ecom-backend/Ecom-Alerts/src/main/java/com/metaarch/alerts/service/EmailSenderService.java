package com.metaarch.alerts.service;

import java.time.format.DateTimeFormatter;
import java.util.StringJoiner;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.metaarch.alerts.event.BookingAlertEvent;

@Service
public class EmailSenderService {
  private static final Logger LOGGER = LoggerFactory.getLogger(EmailSenderService.class);
  private static final DateTimeFormatter SHOW_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

  private final JavaMailSender mailSender;
  private final String fromEmail;

  public EmailSenderService(
    JavaMailSender mailSender,
    @Value("${app.mail.from}") String fromEmail
  ) {
    this.mailSender = mailSender;
    this.fromEmail = fromEmail;
  }

  public void sendBookingAlert(BookingAlertEvent event) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(fromEmail);
    message.setTo(event.getEmailTo());
    message.setSubject(resolveSubject(event));
    message.setText(buildBookingMessage(event));
    mailSender.send(message);
    LOGGER.info("Booking alert mail sent for bookingId={} to={}", event.getBookingId(), event.getEmailTo());
  }

  public void sendPlainTextMail(String emailTo, String subject, String body) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(fromEmail);
    message.setTo(emailTo);
    message.setSubject(subject);
    message.setText(body);
    mailSender.send(message);
    LOGGER.info("Manual alert mail sent to={}", emailTo);
  }

  private String resolveSubject(BookingAlertEvent event) {
    if (StringUtils.hasText(event.getSubject())) {
      return event.getSubject();
    }
    return "Booking confirmation - " + defaultValue(event.getBookingId(), "NA");
  }

  private String buildBookingMessage(BookingAlertEvent event) {
    if (StringUtils.hasText(event.getMessage())) {
      return event.getMessage();
    }

    StringJoiner joiner = new StringJoiner(System.lineSeparator());
    joiner.add("Hello " + defaultValue(event.getCustomerName(), "Customer") + ",");
    joiner.add("");
    joiner.add("Your booking is confirmed.");
    joiner.add("Booking Id: " + defaultValue(event.getBookingId(), "NA"));
    joiner.add("Movie: " + defaultValue(event.getMovieName(), "NA"));
    joiner.add("Theatre: " + defaultValue(event.getTheatreName(), "NA"));
    joiner.add("Screen: " + defaultValue(event.getScreenName(), "NA"));
    joiner.add("Show Time: " + formatShowTime(event));
    joiner.add("Seats: " + formatSeats(event));
    joiner.add("");
    joiner.add("Thank you for booking with us.");
    return joiner.toString();
  }

  private String formatShowTime(BookingAlertEvent event) {
    return event.getShowTime() == null ? "NA" : event.getShowTime().format(SHOW_TIME_FORMATTER);
  }

  private String formatSeats(BookingAlertEvent event) {
    return event.getSeatNumbers() == null || event.getSeatNumbers().isEmpty()
      ? "NA"
      : String.join(", ", event.getSeatNumbers());
  }

  private String defaultValue(String value, String fallback) {
    return StringUtils.hasText(value) ? value : fallback;
  }
}
