package com.metaarch.alerts;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest
class AlertsServiceApplicationTests {
  @MockBean
  private JavaMailSender javaMailSender;

  @Test
  void contextLoads() {
    // Intentionally empty: the test passes when the Spring application context starts successfully.
  }
}
