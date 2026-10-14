package com.metaarch.customerprofile.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;
import static org.junit.jupiter.api.Assertions.*;

class JwtCompatibilityTest {
  @Test void verifiesAllSupportedHmacKeySizesAndRejectsWrongKeys() throws Exception {
    int[] sizes = {32, 48, 64};
    JWSAlgorithm[] algorithms = {JWSAlgorithm.HS256, JWSAlgorithm.HS384, JWSAlgorithm.HS512};
    for (int i = 0; i < sizes.length; i++) {
      String secret = "a".repeat(sizes[i]);
      SignedJWT token = new SignedJWT(new JWSHeader(algorithms[i]), new JWTClaimsSet.Builder()
        .subject("test-customer").issueTime(new Date()).expirationTime(new Date(System.currentTimeMillis() + 60000)).build());
      token.sign(new MACSigner(secret));
      var decoder = new SecurityConfig().jwtDecoder(secret);
      assertEquals("test-customer", decoder.decode(token.serialize()).getSubject());
      var wrongKeyDecoder = new SecurityConfig().jwtDecoder("b".repeat(sizes[i]));
      assertThrows(JwtException.class, () -> wrongKeyDecoder.decode(token.serialize()));
    }
  }
}
