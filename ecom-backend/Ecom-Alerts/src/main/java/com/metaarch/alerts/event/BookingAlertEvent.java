package com.metaarch.alerts.event;

import java.time.LocalDateTime;
import java.util.List;

public class BookingAlertEvent {
  private String bookingId;
  private String emailTo;
  private String customerName;
  private String subject;
  private String movieName;
  private String theatreName;
  private String screenName;
  private LocalDateTime showTime;
  private List<String> seatNumbers;
  private String message;

  public String getBookingId() {
    return bookingId;
  }

  public void setBookingId(String bookingId) {
    this.bookingId = bookingId;
  }

  public String getEmailTo() {
    return emailTo;
  }

  public void setEmailTo(String emailTo) {
    this.emailTo = emailTo;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public String getMovieName() {
    return movieName;
  }

  public void setMovieName(String movieName) {
    this.movieName = movieName;
  }

  public String getTheatreName() {
    return theatreName;
  }

  public void setTheatreName(String theatreName) {
    this.theatreName = theatreName;
  }

  public String getScreenName() {
    return screenName;
  }

  public void setScreenName(String screenName) {
    this.screenName = screenName;
  }

  public LocalDateTime getShowTime() {
    return showTime;
  }

  public void setShowTime(LocalDateTime showTime) {
    this.showTime = showTime;
  }

  public List<String> getSeatNumbers() {
    return seatNumbers;
  }

  public void setSeatNumbers(List<String> seatNumbers) {
    this.seatNumbers = seatNumbers;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }
}
