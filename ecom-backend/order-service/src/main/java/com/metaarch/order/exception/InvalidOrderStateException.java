package com.metaarch.order.exception;

public class InvalidOrderStateException extends RuntimeException {
  public InvalidOrderStateException(String message) { super(message); }
}
