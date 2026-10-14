package com.metaarch.notification.sender;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import static org.assertj.core.api.Assertions.*;

class DisabledMailConfigurationTest {
  private final ApplicationContextRunner context = new ApplicationContextRunner()
      .withUserConfiguration(DisabledMailConfiguration.class);

  @Test void disabledDeliveryStartsWithoutSmtpAndCannotPretendToSend() {
    context.withPropertyValues("notification.sending.enabled=false").run(c -> {
      assertThat(c).hasSingleBean(JavaMailSender.class);
      assertThatThrownBy(() -> c.getBean(JavaMailSender.class).send(new SimpleMailMessage()))
          .isInstanceOf(IllegalStateException.class).hasMessage("Email delivery is disabled");
    });
  }

  @Test void enabledDeliveryDoesNotGetDisabledFallback() {
    context.withPropertyValues("notification.sending.enabled=true")
        .run(c -> assertThat(c).doesNotHaveBean(JavaMailSender.class));
  }
}
