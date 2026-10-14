package com.metaarch.orgaccess.identity;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import com.metaarch.orgaccess.security.DatabaseUserDetailsService;
import com.metaarch.orgaccess.security.JwtTokenProvider;

@WebMvcTest(NotificationRecipientController.class)
class NotificationRecipientControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean NotificationRecipientService recipients;
  @MockBean JwtTokenProvider tokens;
  @MockBean DatabaseUserDetailsService users;

  @Test
  @WithMockUser(roles = {"GLOBAL_ADMIN"})
  void authorizedRequestReturnsRecipients() throws Exception {
    when(recipients.findEmails("store-1", "hyderabad")).thenReturn(List.of("manager@example.com", "admin@example.com"));

    mockMvc.perform(get("/internal/notification-recipients")
        .param("storeId", "store-1").param("locationId", "hyderabad").with(csrf()))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.emails[0]").value("manager@example.com"))
      .andExpect(jsonPath("$.emails[1]").value("admin@example.com"));
  }

  @Test
  void unauthorizedRequestIsRejected() throws Exception {
    mockMvc.perform(get("/internal/notification-recipients")
        .param("storeId", "store-1").param("locationId", "hyderabad"))
      .andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(roles = {"STORE_MANAGER"})
  void nonPrivilegedRequestIsForbidden() throws Exception {
    mockMvc.perform(get("/internal/notification-recipients")
        .param("storeId", "store-1").param("locationId", "hyderabad"))
      .andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(roles = {"GLOBAL_ADMIN"})
  void missingScopeIsRejected() throws Exception {
    mockMvc.perform(get("/internal/notification-recipients").param("storeId", "store-1"))
      .andExpect(status().isBadRequest());
  }
}
