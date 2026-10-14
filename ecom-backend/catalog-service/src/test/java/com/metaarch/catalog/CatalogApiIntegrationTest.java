package com.metaarch.catalog;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.JsonNode; import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test; import org.springframework.beans.factory.annotation.Autowired; import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc; import org.springframework.boot.test.context.SpringBootTest; import org.springframework.http.MediaType; import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest @AutoConfigureMockMvc
class CatalogApiIntegrationTest {
 @Autowired MockMvc mvc; @Autowired ObjectMapper json;
 @Test void catalogCrudAndValidationRules() throws Exception {
  mvc.perform(post("/api/v1/stores").contentType(MediaType.APPLICATION_JSON).content("""
    {"id":"store-client-demo","name":"Client Demo Store","location":"Hyderabad","address":"Ameerpet, Hyderabad, Telangana, India","latitude":17.4375000,"longitude":78.4482000,"provider":"OPENSTREETMAP","providerPlaceId":"demo-place","deliveryEnabled":true,"pickupEnabled":true,"active":true}
    """)).andExpect(status().isCreated()).andExpect(jsonPath("$.id").value("store-client-demo")).andExpect(jsonPath("$.latitude").value(17.4375000));
  mvc.perform(get("/api/v1/stores").param("active","true")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").exists());
  JsonNode category=json.readTree(mvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON).content("""
    {"name":"Phones","slug":"phones","description":"Mobile phones","active":true}
    """)).andExpect(status().isCreated()).andExpect(jsonPath("$.slug").value("phones")).andReturn().getResponse().getContentAsString());
  String categoryId=category.get("id").asText();
  JsonNode product=json.readTree(mvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content("""
    {"categoryId":"%s","name":"Example Phone","slug":"example-phone","sku":"PHONE-001","description":"Example","brand":"MetaArch","status":"ACTIVE"}
    """.formatted(categoryId))).andExpect(status().isCreated()).andExpect(jsonPath("$.categoryId").value(categoryId)).andReturn().getResponse().getContentAsString());
  String productId=product.get("id").asText();
  mvc.perform(post("/api/v1/products/{id}/variants",productId).contentType(MediaType.APPLICATION_JSON).content("""
    {"sku":"PHONE-001-BLK","name":"Black","price":500.00,"compareAtPrice":400.00,"active":true}
    """)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("compareAtPrice must be greater than or equal to price"));
  mvc.perform(post("/api/v1/store-products").contentType(MediaType.APPLICATION_JSON).content("""
    {"storeId":"store-1","productId":"%s","available":true,"priceOverride":475.00}
    """.formatted(productId))).andExpect(status().isCreated());
  mvc.perform(post("/api/v1/store-products").contentType(MediaType.APPLICATION_JSON).content("""
    {"storeId":"store-1","productId":"%s","available":true}
    """.formatted(productId))).andExpect(status().isConflict());
  mvc.perform(delete("/api/v1/categories/{id}",categoryId)).andExpect(status().isConflict());
  mvc.perform(get("/api/v1/products").param("status","ACTIVE")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
 }

 @Test void rejectsInvalidCategorySlug() throws Exception {
  mvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON).content("""
    {"name":"Bad slug","slug":"Bad Slug","active":true}
    """)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.slug").exists());
 }
}
