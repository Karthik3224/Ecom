package com.metaarch.order.order;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;

class CheckoutGroupStateTest {
  @Test void progressesOnlyAfterReservationAndCommit() {
    assertThat(CheckoutGroupState.PREPARED.canTransitionTo(CheckoutGroupState.RESERVING)).isTrue();
    assertThat(CheckoutGroupState.RESERVING.canTransitionTo(CheckoutGroupState.COMMITTING)).isTrue();
    assertThat(CheckoutGroupState.COMMITTING.canTransitionTo(CheckoutGroupState.COMPLETED)).isTrue();
    assertThat(CheckoutGroupState.PREPARED.canTransitionTo(CheckoutGroupState.COMPLETED)).isFalse();
    assertThat(CheckoutGroupState.RESERVING.canTransitionTo(CheckoutGroupState.COMPLETED)).isFalse();
  }

  @Test void compensationMustFinishBeforeFailureIsTerminal() {
    for (var state : new CheckoutGroupState[]{CheckoutGroupState.PREPARED, CheckoutGroupState.RESERVING, CheckoutGroupState.COMMITTING}) {
      assertThat(state.canTransitionTo(CheckoutGroupState.COMPENSATING)).isTrue();
      assertThat(state.canTransitionTo(CheckoutGroupState.FAILED)).isFalse();
    }
    assertThat(CheckoutGroupState.COMPENSATING.canTransitionTo(CheckoutGroupState.FAILED)).isTrue();
  }

  @Test void terminalStatesCannotBeReopenedAndDuplicateTransitionsAreSafe() {
    for (var state : CheckoutGroupState.values()) {
      assertThat(state.canTransitionTo(state)).isTrue();
      for (var terminal : new CheckoutGroupState[]{CheckoutGroupState.COMPLETED, CheckoutGroupState.FAILED}) {
        assertThat(terminal.canTransitionTo(state)).isEqualTo(terminal == state);
      }
    }
  }
}
