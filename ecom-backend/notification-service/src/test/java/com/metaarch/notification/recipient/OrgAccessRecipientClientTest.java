package com.metaarch.notification.recipient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class OrgAccessRecipientClientTest {
  @Test
  void normalizesValidRecipientsAndRemovesInvalidDuplicates() {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    server.expect(once(), requestTo("http://org-access/internal/notification-recipients?storeId=store-1&locationId=hyderabad"))
      .andExpect(header("Authorization", "Bearer token"))
      .andRespond(withSuccess("{\"emails\":[\"Manager@Example.com\",\"admin@example.com\",\"manager@example.com\",null,\"bad\",\" \" ]}", MediaType.APPLICATION_JSON));

    OrgAccessRecipientClient client = new OrgAccessRecipientClient(builder, "http://org-access", "token");

    assertThat(client.findRecipients("store-1", "hyderabad"))
      .containsExactly("manager@example.com", "admin@example.com");
  }

  @Test
  void safelyReturnsEmptyForMissingInputAndHttpFailure() {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    server.expect(once(), requestTo("http://org-access/internal/notification-recipients?storeId=store-1&locationId=hyderabad"))
      .andRespond(withSuccess("", MediaType.APPLICATION_JSON));
    OrgAccessRecipientClient client = new OrgAccessRecipientClient(builder, "http://org-access", "");

    assertThat(client.findRecipients(null, "hyderabad")).isEmpty();
    assertThat(client.findRecipients("store-1", null)).isEmpty();
    assertThat(client.findRecipients("store-1", "hyderabad")).isEmpty();
  }
}
