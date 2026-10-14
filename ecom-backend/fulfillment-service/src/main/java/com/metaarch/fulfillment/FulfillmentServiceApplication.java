package com.metaarch.fulfillment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class FulfillmentServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(FulfillmentServiceApplication.class, args);
  }
}
