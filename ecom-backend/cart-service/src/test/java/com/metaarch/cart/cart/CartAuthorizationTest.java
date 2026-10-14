package com.metaarch.cart.cart;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CartAuthorizationTest {
  @Autowired MockMvc mvc;
  @Autowired CartRepository carts;

  @Test void allIdBasedEndpointsRejectStrangersAndGuests() throws Exception {
    UUID owner = UUID.randomUUID();
    Cart cart = carts.save(new Cart(owner, "security-test"));
    String base = "/api/v1/carts/" + cart.getId();
    String item = base + "/items/" + UUID.randomUUID();
    var requests = java.util.List.of(get(base), post(base + "/items").content("{\"productId\":\"" + UUID.randomUUID() + "\",\"productName\":\"Test\",\"quantity\":1,\"unitPrice\":10}"),
      patch(item).content("{\"quantity\":2}"), delete(item), delete(base + "/items"),
      post(base + "/calculate-total"), patch(item + "/save-for-later"), patch(item + "/move-to-cart"),
      post(base + "/checkout-claim").content("{\"requestHash\":\""+"a".repeat(64)+"\",\"storeId\":\"security-test\",\"items\":[{\"productId\":\""+UUID.randomUUID()+"\",\"quantity\":1}]}"));
    for (var request : requests) {
      request.contentType("application/json");
      mvc.perform(request).andExpect(status().isUnauthorized());
      mvc.perform(request.with(jwt().jwt(j -> j.claim("customerId", UUID.randomUUID().toString()))))
        .andExpect(status().isForbidden());
    }
    mvc.perform(get(base).with(jwt().jwt(j -> j.claim("customerId", owner.toString())))).andExpect(status().isOk());
  }

  @Test void customerParametersCannotImpersonateAnotherCustomer() throws Exception {
    UUID other = UUID.randomUUID();
    var auth = jwt().jwt(j -> j.claim("customerId", UUID.randomUUID().toString()));
    mvc.perform(get("/api/v1/carts/active").param("customerId", other.toString()).param("storeId", "test").with(auth))
      .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/carts").contentType("application/json")
      .content("{\"customerId\":\"" + other + "\",\"storeId\":\"test\"}").with(auth)).andExpect(status().isForbidden());
  }

  @Test void staffRolesAndMissingCustomerClaimsDoNotGrantCartAccess() throws Exception {
    Cart cart = carts.save(new Cart(UUID.randomUUID(), "admin-denial-test"));
    mvc.perform(get("/api/v1/carts/" + cart.getId()).with(jwt()
      .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))))
      .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/carts/" + cart.getId()).with(jwt().jwt(j -> j.claim("customerId", "invalid"))))
      .andExpect(status().isForbidden());
  }
}
