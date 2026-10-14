package com.metaarch.orgaccess.customer;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class CustomerAuthValidationTest {
  @Test void validatesSignupNameAndGmail() {
    assertDoesNotThrow(() -> CustomerAuthService.validateSignupContact("John Doe", "first.last@gmail.com"));
    for (String name : new String[]{"", "Ab", "A B", "123", "Joe123"})
      assertThrows(ResponseStatusException.class, () -> CustomerAuthService.validateSignupContact(name, "user@gmail.com"));
    for (String email : new String[]{"user@example.com", "user@gmail.com.evil", "a..b@gmail.com", "a b@gmail.com"})
      assertThrows(ResponseStatusException.class, () -> CustomerAuthService.validateSignupContact("John Doe", email));
  }
  @Test void normalizesMobileToOneIdentity() {
    assertEquals("+919876543210",CustomerAuthService.mobile("9876543210"));
    assertEquals("+919876543210",CustomerAuthService.mobile("+91 (98765) 43210"));
    assertThrows(ResponseStatusException.class,()->CustomerAuthService.mobile("invalid"));
    assertThrows(ResponseStatusException.class,()->CustomerAuthService.mobile("+449876543210"));
    assertThrows(ResponseStatusException.class,()->CustomerAuthService.mobile("1234567890"));
  }
  @Test void enforcesPasswordConfirmationStrengthAndBcryptByteLimit() {
    assertDoesNotThrow(()->CustomerAuthService.validatePassword("ValidPass123!","ValidPass123!"));
    assertThrows(ResponseStatusException.class,()->CustomerAuthService.validatePassword("ValidPass123!","different"));
    assertThrows(ResponseStatusException.class,()->CustomerAuthService.validatePassword("weakpass","weakpass"));
    String oversized="Aa1"+"\u00e9".repeat(35);
    assertThrows(ResponseStatusException.class,()->CustomerAuthService.validatePassword(oversized,oversized));
  }
}
