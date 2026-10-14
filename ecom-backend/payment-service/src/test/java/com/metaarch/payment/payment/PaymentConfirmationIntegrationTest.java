package com.metaarch.payment.payment;

import com.metaarch.payment.provider.*;
import com.metaarch.payment.exception.InvalidPaymentStateException;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
@SpringBootTest(properties={
  "spring.cloud.config.enabled=false", "eureka.client.enabled=false",
  "spring.datasource.url=jdbc:h2:mem:provider_sync_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
  "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
  "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect", "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
  "spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false",
  "spring.sql.init.mode=always", "spring.sql.init.schema-locations=classpath:sync-schema.sql,classpath:provider-confirmation-test-schema.sql",
  "sync.dispatch-enabled=false", "sync.service=payment-service", "sync.routes.payment=order-service,fulfillment-service,notification-service",
  "sync.targets.order-service=http://127.0.0.1:1", "sync.targets.fulfillment-service=http://127.0.0.1:1", "sync.targets.notification-service=http://127.0.0.1:1"
})
class PaymentConfirmationIntegrationTest {
  @Autowired org.springframework.test.web.servlet.MockMvc mvc;
  @MockBean org.springframework.security.oauth2.jwt.JwtDecoder decoder;
  @Autowired PaymentConfirmationService confirmations;
  @Autowired PaymentRepository payments;
  @Autowired JdbcTemplate jdbc;
  @MockBean PaymentProvider provider;
  Payment payment;
  String remoteId;
  byte[] body = "verified webhook fixture".getBytes(java.nio.charset.StandardCharsets.UTF_8);

  @BeforeEach void setup() {
    reset(decoder);
    when(decoder.decode(anyString())).thenAnswer(call ->
      org.springframework.security.oauth2.jwt.Jwt.withTokenValue(call.getArgument(0)).header("alg", "HS256")
        .subject("test-customer").claim("customerId", call.getArgument(0).toString())
        .claim("accountType", "admin".equals(call.getArgument(0)) ? "staff" : "customer")
        .claim("roles", java.util.List.of("admin".equals(call.getArgument(0)) ? "ROLE_ADMIN" : "ROLE_CUSTOMER")).build());
    payment = payments.save(new Payment(UUID.randomUUID(), UUID.randomUUID(), "PAY-" + UUID.randomUUID(), new BigDecimal("50.00"), "INR", PaymentMethod.DEMO_CARD));
    remoteId = UUID.randomUUID().toString();
    jdbc.update("INSERT INTO provider_payment_bindings VALUES (?,?)", remoteId, payment.getId().toString());
    when(provider.verifyWebhook(body, "verified-signature")).thenReturn(new PaymentProvider.VerifiedWebhook(UUID.randomUUID().toString(), remoteId));
  }
  void evidence(BigDecimal amount, PaymentProvider.Status status) {
    when(provider.verify(remoteId)).thenReturn(new PaymentProvider.Confirmation(remoteId, payment.getOrderId(), amount, "INR", status, "verified-evidence"));
  }
  @Test void verifiedSuccessAndDuplicateWebhookCommitOnce() {
    evidence(new BigDecimal("50.00"), PaymentProvider.Status.SUCCEEDED);
    confirmations.confirm(body, "verified-signature");
    confirmations.confirm(body, "verified-signature");
    assertThat(payments.findById(payment.getId()).orElseThrow().getStatus()).isEqualTo(PaymentStatus.SUCCESS);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox WHERE aggregate_id=?", Integer.class, payment.getOrderId().toString())).isEqualTo(3);
  }
  @Test void mismatchedAmountCannotMarkPaidOrEnqueueEvent() {
    evidence(new BigDecimal("1.00"), PaymentProvider.Status.SUCCEEDED);
    assertThatThrownBy(() -> confirmations.confirm(body, "verified-signature")).isInstanceOf(InvalidPaymentStateException.class);
    assertThat(payments.findById(payment.getId()).orElseThrow().getStatus()).isEqualTo(PaymentStatus.PENDING);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox WHERE aggregate_id=?", Integer.class, payment.getOrderId().toString())).isZero();
  }
  @Test void verifiedFailureRemainsUnpaid() {
    evidence(new BigDecimal("50.00"), PaymentProvider.Status.FAILED);
    confirmations.confirm(body, "verified-signature");
    assertThat(payments.findById(payment.getId()).orElseThrow().getStatus()).isEqualTo(PaymentStatus.FAILED);
  }
  @Test void invalidSignatureCannotReachStatusVerification() {
    assertThatThrownBy(() -> confirmations.confirm(body, "invalid-signature")).isInstanceOf(InvalidPaymentStateException.class);
    verify(provider, never()).verify(anyString());
  }
  @Test void paymentReadsRequireOwnerAndDemoMutationsAreDenied() throws Exception {
    String path = "/api/v1/payments/" + payment.getId();
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path))
      .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
    String owner = "Bearer " + payment.getCustomerId();
    String stranger = "Bearer " + UUID.randomUUID();
    for (String suffix : java.util.List.of("", "/status", "/transactions")) {
      mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path + suffix).header("Authorization", owner))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
      mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path + suffix).header("Authorization", stranger))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
      mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path + suffix).header("Authorization", "Bearer admin"))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
    }
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/payments/order/" + payment.getOrderId()).header("Authorization", stranger))
      .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path + "/refund-demo").header("Authorization", owner))
      .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path + "/process-demo")
      .header("Authorization", "Bearer admin").contentType(org.springframework.http.MediaType.APPLICATION_JSON)
      .content("{\"status\":\"SUCCESS\"}")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
  }
}
