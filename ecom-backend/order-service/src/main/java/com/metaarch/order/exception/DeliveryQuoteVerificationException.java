package com.metaarch.order.exception;

public class DeliveryQuoteVerificationException extends RuntimeException {
  public DeliveryQuoteVerificationException(String message) { super(message); }
  public DeliveryQuoteVerificationException(String message, Throwable cause) { super(message, cause); }
}
