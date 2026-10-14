package com.metaarch.orgaccess.customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/customer")
public class CustomerAuthController {
  private final CustomerAuthService service;
  public CustomerAuthController(CustomerAuthService service) { this.service=service; }
  public record Signup(@NotBlank @Size(max=120) String name,
      @NotBlank @Email @Size(max=190) String email,
      @NotBlank @Size(max=30) String mobile,
      @NotBlank @Size(min=8,max=72) String password,
      @NotBlank @Size(max=72) String confirmPassword) { @Override public String toString() { return "[credentials redacted]"; } }
  public record Login(@NotBlank @Size(max=190) String email, @NotBlank @Size(max=100) String password) { @Override public String toString() { return "[credentials redacted]"; } }
  public record Send(@NotBlank @Size(max=190) String destination, @Pattern(regexp="SIGNUP|RESET|MOBILE|EMAIL_LOGIN") @NotNull String purpose) {}
  public record Verify(@NotBlank @Size(max=36) String challengeId, @Pattern(regexp="\\d{6}") @NotNull String code) { @Override public String toString() { return "[verification redacted]"; } }
  public record Reset(@NotBlank @Size(max=36) String challengeId, @NotBlank @Size(max=100) String resetToken,
      @NotBlank @Size(min=8,max=72) String password, @NotBlank @Size(max=72) String confirmPassword) {}
  @GetMapping("/options") public Object options() { return Map.of("mobileOtpEnabled",service.mobileEnabled()); }
  @PostMapping("/register") public Object register(@Valid @RequestBody Signup input, HttpServletRequest request) {
    service.rate("ip:"+request.getRemoteAddr(),30); return service.register(input);
  }
  @PostMapping("/login") public Object login(@Valid @RequestBody Login input, HttpServletRequest request) {
    service.rate("ip:"+request.getRemoteAddr(),60); return service.login(input);
  }
  @PostMapping("/otp/send") public Object send(@Valid @RequestBody Send input, HttpServletRequest request) {
    service.rate("ip:"+request.getRemoteAddr(),30); return service.send(input);
  }
  @PostMapping("/otp/verify") public Object verify(@Valid @RequestBody Verify input, HttpServletRequest request) {
    service.rate("verify-ip:"+request.getRemoteAddr(),60); return service.verify(input);
  }
  @PostMapping("/password/reset") public Object reset(@Valid @RequestBody Reset input, HttpServletRequest request) {
    service.rate("reset-ip:"+request.getRemoteAddr(),30); service.reset(input); return Map.of("message","Password reset. Please log in.");
  }
}
