package com.metaarch.orgaccess.customer;

import com.metaarch.orgaccess.security.JwtProperties;
import com.metaarch.orgaccess.security.JwtTokenProvider;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class CustomerAuthService {
  private static final String ATTEMPTS = "attempts";
  private static final String EMAIL_VERIFIED = "email_verified";
  private static final String INVALID_OR_EXPIRED_CODE = "Invalid or expired code.";
  private static final String MESSAGE = "message";
  private static final String MOBILE_PURPOSE = "MOBILE";
  private static final String SIGNUP_PURPOSE = "SIGNUP";

  private final JdbcTemplate db;
  private final PasswordEncoder passwords;
  private final JwtTokenProvider tokens;
  private final JwtProperties jwt;
  private final OtpDelivery delivery;
  private final TransactionTemplate tx;
  private final SecureRandom random = new SecureRandom();
  private final String dummyHash;
  public CustomerAuthService(JdbcTemplate db, PasswordEncoder passwords,
      JwtTokenProvider tokens, JwtProperties jwt, OtpDelivery delivery, PlatformTransactionManager manager) {
    this.db=db; this.passwords=passwords; this.tokens=tokens;
    this.jwt=jwt; this.delivery=delivery; this.tx=new TransactionTemplate(manager);
    this.dummyHash=passwords.encode(UUID.randomUUID().toString());
  }
  public boolean mobileEnabled() { return delivery.mobileEnabled(); }
  static String email(String value) { return value.trim().toLowerCase(Locale.ROOT); }
  public static String mobile(String value) {
    String digits=value == null ? "" : value.replaceAll("[\\s()+-]", "");
    if (digits.matches("[0-9]{10}")) digits="91"+digits;
    if (!digits.matches("91[6-9][0-9]{9}")) throw new ResponseStatusException(BAD_REQUEST,"Enter a valid 10-digit Indian mobile number with country code +91.");
    return "+"+digits;
  }
  static void validatePassword(String password,String confirmation) {
    if (!password.equals(confirmation)) throw new ResponseStatusException(BAD_REQUEST,"Passwords do not match.");
    if (password.getBytes(StandardCharsets.UTF_8).length>72 || password.length()<8 ||
        !password.matches("(?s).*[a-z].*") || !password.matches("(?s).*[A-Z].*") || !password.matches("(?s).*[0-9].*"))
      throw new ResponseStatusException(BAD_REQUEST,"Use 8-72 bytes with uppercase, lowercase and a number.");
  }
  // Counters commit independently of authentication failures and are shared across instances.
  static void validateSignupContact(String name, String address) {
    String fullName = name == null ? "" : name.trim();
    if (fullName.length() > 120 || !fullName.matches("[\\p{L}\\p{M} .'\u2019-]+") || fullName.codePoints().filter(Character::isLetter).count() < 3)
      throw new ResponseStatusException(BAD_REQUEST,"Enter your full name with at least three letters.");
    if (address == null || address.trim().length() > 190 || !address.trim().matches("(?i)[a-z0-9]+(?:\\.[a-z0-9]+)*@gmail\\.com"))
      throw new ResponseStatusException(BAD_REQUEST,"Enter a valid Gmail address ending in @gmail.com.");
  }
  public void rate(String key,int limit) {
    Boolean allowed=tx.execute(status -> {
      db.update("INSERT IGNORE INTO auth_rate_limits(rate_key,window_start,attempts) VALUES(?,CURRENT_TIMESTAMP(6),0)",key);
      Map<String,Object> row=db.queryForMap("SELECT * FROM auth_rate_limits WHERE rate_key=? FOR UPDATE",key);
      Instant start=((Timestamp)row.get("window_start")).toInstant();
      int count=((Number)row.get(ATTEMPTS)).intValue();
      if (start.plusSeconds(900).isBefore(Instant.now())) { count=0; start=Instant.now(); }
      db.update("UPDATE auth_rate_limits SET attempts=?,window_start=? WHERE rate_key=?",count+1,Timestamp.from(start),key);
      return count<limit;
    });
    if (!Boolean.TRUE.equals(allowed)) throw new ResponseStatusException(TOO_MANY_REQUESTS,"Too many attempts. Try again in 15 minutes.");
  }
  private String otpCode() { return String.format(Locale.ROOT,"%06d",random.nextInt(1_000_000)); }
  private String phoneDigits(String phone) { return phone.substring(1); }
  private void requireContactAvailable(String email,String phone) {
    if (db.queryForObject("SELECT COUNT(*) FROM app_customers WHERE LOWER(email)=?",Integer.class,email)>0)
      throw new ResponseStatusException(CONFLICT,"Email already exists. Log in or reset your password.");
    if (db.queryForObject("SELECT COUNT(*) FROM app_customers WHERE REGEXP_REPLACE(mobile,'[^0-9]','') IN (?,?)",Integer.class,phoneDigits(phone),phone.startsWith("+91")?phone.substring(3):phone.substring(1))>0)
      throw new ResponseStatusException(CONFLICT,"Mobile number already exists.");
  }
  // The account is not written to users/customers until the email OTP is verified.
  public Object register(CustomerAuthController.Signup input) {
    validateSignupContact(input.name(), input.email());
    validatePassword(input.password(),input.confirmPassword());
    String email=email(input.email()), phone=mobile(input.mobile());
    rate("signup:"+email,5);
    return tx.execute(status -> {
      db.update("DELETE FROM pending_signups WHERE expires_at < ?",Timestamp.from(Instant.now()));
      requireContactAvailable(email,phone);
      List<Timestamp> latest=db.query("SELECT sent_at FROM pending_signups WHERE email=? ORDER BY sent_at DESC LIMIT 1",(rs,n)->rs.getTimestamp(1),email);
      if (!latest.isEmpty() && latest.get(0).toInstant().plusSeconds(60).isAfter(Instant.now()))
        throw new ResponseStatusException(TOO_MANY_REQUESTS,"Wait 60 seconds before requesting another code.");
      String code=otpCode(), id=UUID.randomUUID().toString();
      db.update("DELETE FROM pending_signups WHERE email=?",email);
      db.update("INSERT INTO pending_signups(id,email,mobile,full_name,password_hash,code_hash,expires_at,sent_at) VALUES(?,?,?,?,?,?,?,?)",
        id,email,phone,input.name().trim(),passwords.encode(input.password()),passwords.encode(code),
        Timestamp.from(Instant.now().plusSeconds(300)),Timestamp.from(Instant.now()));
      delivery.send(email,code,SIGNUP_PURPOSE);
      return challenge(id);
    });
  }
  private Object resendPendingSignup(String email) {
    List<Map<String,Object>> rows=db.queryForList("SELECT * FROM pending_signups WHERE email=? FOR UPDATE",email);
    if (rows.isEmpty()) return challenge(UUID.randomUUID().toString());
    Map<String,Object> pending=rows.get(0);
    if (((Timestamp)pending.get("sent_at")).toInstant().plusSeconds(60).isAfter(Instant.now()))
      throw new ResponseStatusException(TOO_MANY_REQUESTS,"Wait 60 seconds before requesting another code.");
    String code=otpCode(), id=UUID.randomUUID().toString();
    db.update("UPDATE pending_signups SET id=?,code_hash=?,expires_at=?,sent_at=?,attempts=0 WHERE email=?",
      id,passwords.encode(code),Timestamp.from(Instant.now().plusSeconds(300)),Timestamp.from(Instant.now()),email);
    delivery.send(email,code,SIGNUP_PURPOSE);
    return challenge(id);
  }
  private Object completeSignup(Map<String,Object> pending,String code) {
    if (((Number)pending.get(ATTEMPTS)).intValue()>=5 || ((Timestamp)pending.get("expires_at")).toInstant().isBefore(Instant.now()))
      return "Invalid or expired code. Request a new code.";
    db.update("UPDATE pending_signups SET attempts=attempts+1 WHERE id=?",pending.get("id"));
    if (!passwords.matches(code,(String)pending.get("code_hash"))) return INVALID_OR_EXPIRED_CODE;
    String email=(String)pending.get("email"), phone=(String)pending.get("mobile"), name=(String)pending.get("full_name");
    requireContactAvailable(email,phone);
    db.update("INSERT INTO app_customers(id,username,email,mobile,full_name,password_hash) VALUES(UNHEX(REPLACE(?,'-','')),?,?,?,?,?)",
      UUID.randomUUID().toString(),email,email,phone,name,pending.get("password_hash"));
    long customerId=Objects.requireNonNull(db.queryForObject("SELECT user_id FROM app_customers WHERE email=?",Long.class,email));
    db.update("INSERT INTO app_customer_contacts(contact,customer_user_id) VALUES(?,?),(?,?)","email:"+email,customerId,"mobile:"+phoneDigits(phone),customerId);
    db.update("DELETE FROM pending_signups WHERE id=?",pending.get("id"));
    return Map.of(MESSAGE,"Email verified. You can now log in.");
  }
  public Object login(CustomerAuthController.Login input) {
    boolean byMobile=!input.email().contains("@");
    String identifier=byMobile?mobile(input.email()):email(input.email()); rate("login:"+identifier,10);
    List<Map<String,Object>> rows=byMobile
      ?db.queryForList("SELECT u.user_id AS id,u.password_hash,u.email_verified,u.enabled,u.locked FROM app_customers u WHERE REGEXP_REPLACE(u.mobile,'[^0-9]','') IN (?,?)",identifier.substring(1),identifier.substring(3))
      :db.queryForList("SELECT u.user_id AS id,u.password_hash,u.email_verified,u.enabled,u.locked FROM app_customers u WHERE LOWER(u.email)=?",identifier);
    Map<String,Object> user=rows.size()!=1?null:rows.get(0);
    String hash=user==null?dummyHash:(String)user.get("password_hash");
    boolean matches=passwords.matches(input.password(),hash==null?dummyHash:hash);
    if (user==null || !matches || !isCustomer(((Number)user.get("id")).longValue())) throw new ResponseStatusException(UNAUTHORIZED,"Incorrect email, mobile number or password.");
    if (!truth(user.get(EMAIL_VERIFIED))) throw new ResponseStatusException(FORBIDDEN,"Verify your email before logging in.");
    if (!truth(user.get("enabled")) || truth(user.get("locked"))) throw new ResponseStatusException(FORBIDDEN,"Account is unavailable.");
    return session(((Number)user.get("id")).longValue());
  }
  public Object send(CustomerAuthController.Send input) {
    String purpose=input.purpose();
    if (!Set.of("SIGNUP","RESET","MOBILE","EMAIL_LOGIN").contains(purpose)) throw new ResponseStatusException(BAD_REQUEST,"Invalid verification purpose.");
    if (purpose.equals(MOBILE_PURPOSE) && !mobileEnabled()) throw new ResponseStatusException(SERVICE_UNAVAILABLE,"Mobile login is unavailable.");
    String destination=purpose.equals(MOBILE_PURPOSE)?mobile(input.destination()):email(input.destination());
    if (!purpose.equals(MOBILE_PURPOSE) && !destination.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) throw new ResponseStatusException(BAD_REQUEST,"Enter a valid email.");
    rate("send:"+destination,5);
    return tx.execute(status -> {
      if (purpose.equals(SIGNUP_PURPOSE)) return resendPendingSignup(destination);
      List<Map<String,Object>> users=purpose.equals(MOBILE_PURPOSE)
        ?db.queryForList("SELECT u.user_id AS id,u.password_hash,u.email_verified,u.enabled,u.locked FROM app_customers u WHERE REGEXP_REPLACE(u.mobile,'[^0-9]','') IN (?,?)",destination.substring(1),destination.startsWith("+91")?destination.substring(3):destination.substring(1))
        :db.queryForList("SELECT u.user_id AS id,u.password_hash,u.email_verified,u.enabled,u.locked FROM app_customers u WHERE LOWER(u.email)=?",destination);
      if (users.size()!=1) return challenge(UUID.randomUUID().toString());
      Map<String,Object> user=users.get(0);
      if (!isCustomer(((Number)user.get("id")).longValue())) return challenge(UUID.randomUUID().toString());
      if (truth(user.get("locked")) || (purpose.equals(SIGNUP_PURPOSE) ? truth(user.get(EMAIL_VERIFIED)) : !truth(user.get(EMAIL_VERIFIED)))) return challenge(UUID.randomUUID().toString());
      if ((purpose.equals(MOBILE_PURPOSE) || purpose.equals("EMAIL_LOGIN")) && !truth(user.get("enabled"))) return challenge(UUID.randomUUID().toString());
      return issue(((Number)user.get("id")).longValue(),purpose,destination);
    });
  }
  private Object issue(long userId,String purpose,String destination) {
    db.queryForMap("SELECT user_id FROM app_customers WHERE user_id=? FOR UPDATE",userId);
    List<Timestamp> latest=db.query("SELECT sent_at FROM app_customer_otp WHERE user_id=? AND purpose=? ORDER BY sent_at DESC LIMIT 1",(rs,n)->rs.getTimestamp(1),userId,purpose);
    if (!latest.isEmpty() && latest.get(0).toInstant().plusSeconds(60).isAfter(Instant.now())) throw new ResponseStatusException(TOO_MANY_REQUESTS,"Wait 60 seconds before requesting another code.");
    String code=String.format(Locale.ROOT,"%06d",random.nextInt(1_000_000)), id=UUID.randomUUID().toString();
    db.update("UPDATE app_customer_otp SET consumed=TRUE,reset_hash=NULL WHERE user_id=? AND purpose=?",userId,purpose);
    db.update("INSERT INTO app_customer_otp(id,user_id,purpose,code_hash,expires_at,sent_at) VALUES(?,?,?,?,?,?)",id,userId,purpose,passwords.encode(code),Timestamp.from(Instant.now().plusSeconds(300)),Timestamp.from(Instant.now()));
    delivery.send(destination,code,purpose);
    return challenge(id);
  }
  private Map<String,Object> challenge(String id) {
    Map<String,Object> result = new LinkedHashMap<>();
    result.put("challengeId",id);
    result.put("expiresInSeconds",300);
    result.put("resendAfterSeconds",60);
    result.put(MESSAGE,"If the account is eligible, a verification code has been sent.");
    return result;
  }
  public Object verify(CustomerAuthController.Verify input) {
    Object result=tx.execute(status -> {
      List<Map<String,Object>> pending=db.queryForList("SELECT * FROM pending_signups WHERE id=? FOR UPDATE",input.challengeId());
      if (!pending.isEmpty()) return completeSignup(pending.get(0),input.code());
      List<Map<String,Object>> rows=db.queryForList("SELECT * FROM app_customer_otp WHERE id=? FOR UPDATE",input.challengeId());
      if (rows.isEmpty()) return INVALID_OR_EXPIRED_CODE;
      Map<String,Object> otp=rows.get(0);
      if (truth(otp.get("consumed")) || ((Number)otp.get(ATTEMPTS)).intValue()>=5 || ((Timestamp)otp.get("expires_at")).toInstant().isBefore(Instant.now())) return "Invalid or expired code. Request a new code.";
      db.update("UPDATE app_customer_otp SET attempts=attempts+1 WHERE id=?",input.challengeId());
      if (!passwords.matches(input.code(),(String)otp.get("code_hash"))) return INVALID_OR_EXPIRED_CODE;
      long id=((Number)otp.get("user_id")).longValue();
      if (Set.of("MOBILE","EMAIL_LOGIN").contains((String)otp.get("purpose"))) {
        List<Map<String,Object>> accounts=db.queryForList("SELECT enabled,locked,email_verified FROM app_customers WHERE user_id=? FOR UPDATE",id);
        if (accounts.size()!=1 || !truth(accounts.get(0).get("enabled")) || truth(accounts.get(0).get("locked")) || !truth(accounts.get(0).get(EMAIL_VERIFIED))) return INVALID_OR_EXPIRED_CODE;
      }
      db.update("UPDATE app_customer_otp SET consumed=TRUE WHERE id=?",input.challengeId());
      String purpose=(String)otp.get("purpose");
      if (purpose.equals("RESET")) {
        String resetToken=UUID.randomUUID().toString()+UUID.randomUUID();
        db.update("UPDATE app_customer_otp SET reset_hash=?,reset_expires_at=? WHERE id=?",passwords.encode(resetToken),Timestamp.from(Instant.now().plusSeconds(300)),input.challengeId());
        return Map.of("resetToken",resetToken,"challengeId",input.challengeId());
      }
      if (purpose.equals(SIGNUP_PURPOSE)) {
        db.update("UPDATE users SET email_verified=TRUE,enabled=TRUE,status='Active' WHERE id=? AND locked=FALSE",id);
        return Map.of(MESSAGE,"Email verified. You can now log in.");
      }
      return session(id);
    });
    if (result instanceof String error) throw new ResponseStatusException(BAD_REQUEST,error);
    return result;
  }
  public void reset(CustomerAuthController.Reset input) {
    validatePassword(input.password(),input.confirmPassword());
    Boolean done=tx.execute(status -> {
      List<Map<String,Object>> rows=db.queryForList("SELECT * FROM app_customer_otp WHERE id=? AND purpose='RESET' FOR UPDATE",input.challengeId());
      if (rows.isEmpty()) return false;
      Map<String,Object> otp=rows.get(0);
      if (otp.get("reset_hash")==null || !truth(otp.get("consumed")) || ((Timestamp)otp.get("reset_expires_at")).toInstant().isBefore(Instant.now()) || !passwords.matches(input.resetToken(),(String)otp.get("reset_hash"))) return false;
      long id=((Number)otp.get("user_id")).longValue();
      db.update("UPDATE app_customers SET password_hash=?,token_version=token_version+1 WHERE user_id=?",passwords.encode(input.password()),id);
      db.update("UPDATE app_customer_otp SET reset_hash=NULL,consumed=TRUE WHERE user_id=?",id);
      return true;
    });
    if (!Boolean.TRUE.equals(done)) throw new ResponseStatusException(BAD_REQUEST,"Reset session expired or invalid. Request a new code.");
  }
  public Map<String,Object> profile(String username) {
    Map<String,Object> user=db.queryForMap("SELECT BIN_TO_UUID(id) AS id,user_id AS userId,username,email,mobile AS phone,full_name AS name,'customer' AS role FROM app_customers WHERE username=?",username);
    return user;
  }
  private boolean isCustomer(long id) {
    return db.queryForObject("SELECT COUNT(*) FROM app_customers WHERE user_id=?",Integer.class,id)>0;
  }
  private Object session(long id) {
    if (!isCustomer(id)) throw new ResponseStatusException(FORBIDDEN,"Customer account required.");
    String username=db.queryForObject("SELECT username FROM app_customers WHERE user_id=?",String.class,id);
    return Map.of("token",tokens.generateCustomerToken(username),"user",profile(username),"expiresInMillis",jwt.getExpirationMillis());
  }
  private static boolean truth(Object value) { return Boolean.TRUE.equals(value) || value instanceof Number number && number.intValue()!=0; }
}
