package com.metaarch.order.order;

public enum CheckoutGroupState {
  PREPARED, RESERVING, COMMITTING, COMPLETED, COMPENSATING, FAILED;

  public boolean canTransitionTo(CheckoutGroupState next) {
    if (this == next) return true;
    return switch (this) {
      case PREPARED -> next == RESERVING || next == COMPENSATING;
      case RESERVING -> next == COMMITTING || next == COMPENSATING;
      case COMMITTING -> next == COMPLETED || next == COMPENSATING;
      case COMPENSATING -> next == FAILED;
      case COMPLETED, FAILED -> false;
    };
  }
}
