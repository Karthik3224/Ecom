package com.metaarch.notification.sender;

import jakarta.mail.internet.MimeMessage;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "notification.sending.enabled", havingValue = "false")
public class DisabledMailConfiguration {
  @Bean
  @ConditionalOnMissingBean(JavaMailSender.class)
  JavaMailSender disabledMailSender() {
    return new JavaMailSenderImpl() {
      @Override public void send(SimpleMailMessage... messages) {
        throw new IllegalStateException("Email delivery is disabled");
      }
      @Override public void send(MimeMessage... messages) {
        throw new IllegalStateException("Email delivery is disabled");
      }
    };
  }
}
