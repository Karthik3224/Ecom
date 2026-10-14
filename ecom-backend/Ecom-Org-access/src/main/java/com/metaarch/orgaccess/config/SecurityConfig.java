package com.metaarch.orgaccess.config;

import com.metaarch.orgaccess.security.JwtAuthenticationFilter;
import com.metaarch.orgaccess.security.OAuth2ProvisioningSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.ObjectProvider;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final OAuth2ProvisioningSuccessHandler oauth2SuccessHandler;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
      OAuth2ProvisioningSuccessHandler oauth2SuccessHandler) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.oauth2SuccessHandler = oauth2SuccessHandler;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      ObjectProvider<ClientRegistrationRepository> clientRegistrations) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/customer/**")
                    .permitAll()
                    .requestMatchers("/actuator/health", "/actuator/prometheus", "/api/ping")
                    .permitAll()
                    .requestMatchers("/api/auth/validate", "/api/auth/me")
                    .authenticated()
                    .anyRequest()
                    .authenticated());

    if (clientRegistrations.getIfAvailable() != null) {
      http.oauth2Login(oauth -> oauth.successHandler(oauth2SuccessHandler));
    }

    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
      throws Exception {
    return configuration.getAuthenticationManager();
  }
}
