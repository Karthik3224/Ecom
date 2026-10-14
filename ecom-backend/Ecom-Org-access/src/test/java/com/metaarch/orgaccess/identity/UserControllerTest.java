package com.metaarch.orgaccess.identity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.metaarch.orgaccess.security.DatabaseUserDetailsService;
import com.metaarch.orgaccess.security.JwtTokenProvider;

@WebMvcTest(UserController.class)
class UserControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean IdentityService identities;
  @MockBean JwtTokenProvider tokens;
  @MockBean DatabaseUserDetailsService users;

  @Test
  @WithMockUser(authorities = {"ROLE_GLOBAL_ADMIN", "PERM_USER_WRITE"})
  void validatesUserCreationPayload() throws Exception {
    mockMvc.perform(post("/api/users").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"x\",\"email\":\"bad\",\"password\":\"short\",\"role\":\"CUSTOMER\"}"))
        .andExpect(status().isBadRequest());
  }
}
