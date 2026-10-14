package com.metaarch.payment.payment;

import com.metaarch.payment.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PaymentControllerCapabilitiesTest {
  @Test void capabilitiesAreJsonAndProcessingIsDisabled() throws Exception {
    var mvc = MockMvcBuilders.standaloneSetup(new PaymentController(mock(PaymentService.class)))
        .setControllerAdvice(new GlobalExceptionHandler()).build();
    mvc.perform(get("/api/v1/payments/capabilities")).andExpect(status().isOk())
        .andExpect(jsonPath("$.processingEnabled").value(false));
  }
  @Test void malformedPaymentIdIsNotAnInternalServerError() throws Exception {
    var mvc = MockMvcBuilders.standaloneSetup(new PaymentController(mock(PaymentService.class)))
        .setControllerAdvice(new GlobalExceptionHandler()).build();
    mvc.perform(get("/api/v1/payments/not-a-uuid")).andExpect(status().isBadRequest());
  }
}
