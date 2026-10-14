package com.metaarch.alerts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableMethodSecurity
public class AlertsServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(AlertsServiceApplication.class, args);
  }
}
