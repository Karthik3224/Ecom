package com.metaarch.orgaccess;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.metaarch.orgaccess.security.JwtProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class OrgAccessApplication {

  public static void main(String[] args) {
    SpringApplication.run(OrgAccessApplication.class, args);
  }
}
