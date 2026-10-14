package com.metaarch.orgaccess.customer;

import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Component
public class OtpDelivery {
  private final ObjectProvider<JavaMailSender> mail;
  private final String from, smsUrl, smsToken;
  public OtpDelivery(ObjectProvider<JavaMailSender> mail,
      @Value("${app.otp.mail-from:}") String from,
      @Value("${app.otp.sms-url:}") String smsUrl,
      @Value("${app.otp.sms-token:}") String smsToken) {
    this.mail=mail; this.from=from; this.smsUrl=smsUrl; this.smsToken=smsToken;
  }
  private org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory() {
    var factory=new org.springframework.http.client.SimpleClientHttpRequestFactory(); factory.setConnectTimeout(5000); factory.setReadTimeout(5000); return factory;
  }
  public boolean mobileEnabled() { return smsUrl.startsWith("https://") && !smsToken.isBlank(); }
  public void send(String destination, String code, String purpose) {
    try {
      String text = "Your Pickles & Spices verification code is " + code + ". It expires in 5 minutes. Do not share this code.";
      if (purpose.equals("MOBILE")) {
        if (!mobileEnabled()) throw new IllegalStateException();
        RestClient.builder().requestFactory(requestFactory()).build().post().uri(smsUrl).header("Authorization", "Bearer " + smsToken)
            .body(Map.of("to", destination, "message", text)).retrieve().toBodilessEntity();
      } else {
        JavaMailSender sender = mail.getIfAvailable();
        if (sender == null || from.isBlank()) throw new IllegalStateException();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from); message.setTo(destination);
        message.setSubject(purpose.equals("RESET") ? "Reset your password" : "Verify your email");
        message.setText(text); sender.send(message);
      }
    } catch (RuntimeException error) {
      throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Verification delivery is unavailable. Please try again later.");
    }
  }
}
