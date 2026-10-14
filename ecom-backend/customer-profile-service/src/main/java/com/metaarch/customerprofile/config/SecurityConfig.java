package com.metaarch.customerprofile.config;
import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.SecurityFilterChain;
@Configuration
public class SecurityConfig {
  @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
    return http.csrf(csrf -> csrf.disable()).authorizeHttpRequests(auth -> auth
      .requestMatchers("/actuator/health", "/actuator/info", "/actuator/prometheus").permitAll()
      .requestMatchers("/api/v1/profiles/me", "/api/v1/profiles/me/**").authenticated()
      .requestMatchers("/api/v1/profiles/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "GLOBAL_ADMIN")
      .anyRequest().denyAll())
      .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(authorities()))).build();
  }
  @Bean JwtDecoder jwtDecoder(@Value("${app.jwt.secret}") String secret) {
    byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    MacAlgorithm algorithm = algorithmFor(secretBytes.length);
    var key = new SecretKeySpec(secretBytes, "HmacSHA" + algorithm.getName().substring(2));
    return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(algorithm).build();
  }
  private MacAlgorithm algorithmFor(int secretByteLength) {
    int bitLength = secretByteLength * 8;
    if (bitLength >= 512) return MacAlgorithm.HS512;
    if (bitLength >= 384) return MacAlgorithm.HS384;
    return MacAlgorithm.HS256;
  }
  private Converter<Jwt, ? extends AbstractAuthenticationToken> authorities() {
    return jwt -> {
      var names = new java.util.HashSet<String>();
      for (String claim : java.util.List.of("roles", "authorities")) { Object value = jwt.getClaims().get(claim); if (value instanceof java.util.Collection<?> values) values.forEach(item -> names.add(item.toString())); }
      var granted = names.stream().map(SimpleGrantedAuthority::new).toList();
      return new JwtAuthenticationToken(jwt, granted, jwt.getSubject());
    };
  }
}
