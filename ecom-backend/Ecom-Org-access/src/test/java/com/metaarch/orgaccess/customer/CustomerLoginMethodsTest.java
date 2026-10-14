package com.metaarch.orgaccess.customer;

import com.metaarch.orgaccess.security.JwtProperties;
import com.metaarch.orgaccess.security.JwtTokenProvider;
import java.util.Map;
import java.util.List;
import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class CustomerLoginMethodsTest {
  private final JdbcTemplate db=mock(JdbcTemplate.class);
  private final PasswordEncoder passwords=mock(PasswordEncoder.class);
  private final OtpDelivery delivery=mock(OtpDelivery.class);
  private final CustomerAuthService service=spy(new CustomerAuthService(db,passwords,mock(JwtTokenProvider.class),mock(JwtProperties.class),delivery,mock(PlatformTransactionManager.class)));

  @Test void mobilePasswordLookupUsesNormalizedContactAndRejectsUnknownAccount() {
    doNothing().when(service).rate(anyString(),anyInt());
    when(db.queryForList(anyString(),anyString(),anyString())).thenReturn(List.of());
    assertThrows(ResponseStatusException.class,()->service.login(new CustomerAuthController.Login("9876543210","wrong")));
    verify(db).queryForList(contains("REGEXP_REPLACE(u.mobile"),eq("919876543210"),eq("9876543210"));
    verify(service).rate("login:+919876543210",10);
  }
  @Test void ambiguousMobileCannotChooseAnArbitraryCustomer() {
    doNothing().when(service).rate(anyString(),anyInt());
    when(db.queryForList(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("id",1),Map.of("id",2)));
    assertThrows(ResponseStatusException.class,()->service.login(new CustomerAuthController.Login("+919876543210","wrong")));
    verify(db,never()).queryForObject(contains("SELECT COUNT"),eq(Integer.class),any());
  }
  @Test void emailPasswordLookupRemainsCaseInsensitive() {
    doNothing().when(service).rate(anyString(),anyInt());
    when(db.queryForList(anyString(),eq("customer@example.com"))).thenReturn(List.of());
    assertThrows(ResponseStatusException.class,()->service.login(new CustomerAuthController.Login("Customer@Example.com","wrong")));
    verify(db).queryForList(contains("LOWER(u.email)"),eq("customer@example.com"));
  }
  @Test void unsupportedOtpPurposeIsRejectedBeforeDelivery() {
    assertThrows(ResponseStatusException.class,()->service.send(new CustomerAuthController.Send("customer@example.com","FORGED")));
    verifyNoInteractions(db);
  }
  @Test void emailOtpUsesExistingDeliveryAndDoesNotReturnTheCode() {
    doNothing().when(service).rate(anyString(),anyInt());
    when(db.queryForList(contains("LOWER(u.email)"),eq("customer@example.com"))).thenReturn(List.of(Map.of("id",1L,"enabled",true,"locked",false,"email_verified",true)));
    when(db.queryForObject(contains("SELECT COUNT"),eq(Integer.class),eq(1L))).thenReturn(1);
    Object result=service.send(new CustomerAuthController.Send("Customer@Example.com","EMAIL_LOGIN"));
    verify(delivery).send(eq("customer@example.com"),matches("[0-9]{6}"),eq("EMAIL_LOGIN"));
    assertTrue(result instanceof Map);
    assertFalse(((Map<?,?>)result).containsKey("code"));
  }
  @Test void disabledCustomerDoesNotReceiveEmailLoginOtp() {
    doNothing().when(service).rate(anyString(),anyInt());
    when(db.queryForList(contains("LOWER(u.email)"),eq("customer@example.com"))).thenReturn(List.of(Map.of("id",1L,"enabled",false,"locked",false,"email_verified",true)));
    when(db.queryForObject(contains("SELECT COUNT"),eq(Integer.class),eq(1L))).thenReturn(1);
    service.send(new CustomerAuthController.Send("customer@example.com","EMAIL_LOGIN"));
    verifyNoInteractions(delivery);
  }
  @Test void accountLockedAfterEmailOtpWasSentCannotLogin() {
    when(db.queryForList(contains("pending_signups"),eq("challenge"))).thenReturn(List.of());
    when(db.queryForList(contains("app_customer_otp"),eq("challenge"))).thenReturn(List.of(Map.of("consumed",false,"attempts",0,"expires_at",Timestamp.from(Instant.now().plusSeconds(100)),"code_hash","hash","user_id",1L,"purpose","EMAIL_LOGIN")));
    when(passwords.matches("123456","hash")).thenReturn(true);
    when(db.queryForList(contains("SELECT enabled,locked"),eq(1L))).thenReturn(List.of(Map.of("enabled",true,"locked",true,"email_verified",true)));
    assertThrows(ResponseStatusException.class,()->service.verify(new CustomerAuthController.Verify("challenge","123456")));
    verify(db,never()).update(contains("SET consumed=TRUE WHERE id"),eq("challenge"));
  }
}
