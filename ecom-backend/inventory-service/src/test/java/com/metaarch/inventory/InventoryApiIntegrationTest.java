package com.metaarch.inventory;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;



@SpringBootTest(properties={"app.jwt.secret=inventory-test-only-secret-0000000000000000000000000000000000000000",
  "app.jwt.issuer=org-access", "sync.dispatch-enabled=false", "spring.sql.init.mode=always",
  "spring.sql.init.schema-locations=classpath:sync-schema.sql"})
@AutoConfigureMockMvc
class InventoryApiIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired com.metaarch.inventory.inventory.InventoryService inventories;
  @Autowired com.metaarch.inventory.movement.StockService stock;
  @Autowired com.metaarch.inventory.movement.StockMovementRepository movements;
  @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
  @org.springframework.boot.test.mock.mockito.MockBean org.springframework.security.oauth2.jwt.JwtDecoder decoder;

  @org.junit.jupiter.api.BeforeEach void authentication() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS checkout_reservations(child_id VARCHAR(36) PRIMARY KEY,state VARCHAR(24))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS checkout_reservation_lines(child_id VARCHAR(36),inventory_id BINARY(16),quantity INT)");
    org.mockito.Mockito.when(decoder.decode("admin")).thenReturn(org.springframework.security.oauth2.jwt.Jwt.withTokenValue("admin")
      .header("alg","HS512").subject(UUID.randomUUID().toString()).claim("accountType","staff").claim("roles",java.util.List.of("ROLE_ADMIN")).build());
    for(String role:java.util.List.of("customer","manager")) org.mockito.Mockito.when(decoder.decode(role)).thenReturn(org.springframework.security.oauth2.jwt.Jwt.withTokenValue(role)
      .header("alg","HS512").subject(UUID.randomUUID().toString()).claim("accountType",role.equals("customer")?"customer":"staff")
      .claim("roles",java.util.List.of(role.equals("customer")?"ROLE_CUSTOMER":"ROLE_STORE_MANAGER")).build());
    org.mockito.Mockito.when(decoder.decode("invalid")).thenThrow(new org.springframework.security.oauth2.jwt.BadJwtException("Invalid signature"));
    org.mockito.Mockito.when(decoder.decode("expired")).thenThrow(new org.springframework.security.oauth2.jwt.BadJwtException("Expired token"));
  }

  @Test void manualAdminReleaseCannotConsumeCheckoutHeldStock() throws Exception {
    var inventory=inventories.create(new com.metaarch.inventory.inventory.InventoryRequest(UUID.randomUUID(),null,"held-stock-store",1,3,0,com.metaarch.inventory.inventory.InventoryStatus.ACTIVE));
    String child=UUID.randomUUID().toString();
    byte[] id=java.nio.ByteBuffer.allocate(16).putLong(inventory.id().getMostSignificantBits()).putLong(inventory.id().getLeastSignificantBits()).array();
    jdbc.update("INSERT INTO checkout_reservations VALUES (?,'RESERVED')",child);
    jdbc.update("INSERT INTO checkout_reservation_lines VALUES (?,?,3)",child,id);
    mvc.perform(post("/api/v1/inventories/"+inventory.id()+"/stock/release").header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON)
      .content("{\"quantity\":1,\"reason\":\"manual release\"}")).andExpect(status().isConflict());
    mvc.perform(put("/api/v1/inventories/"+inventory.id()).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON)
      .content("{\"availableQuantity\":4,\"reservedQuantity\":0,\"reorderLevel\":0,\"status\":\"ACTIVE\"}")).andExpect(status().isConflict());
    org.junit.jupiter.api.Assertions.assertEquals(3,inventories.get(inventory.id()).reservedQuantity());
    org.junit.jupiter.api.Assertions.assertEquals(1,inventories.get(inventory.id()).availableQuantity());
  }

  @Test void unauthorizedInventoryChangesAndUnsignedEventsAreDenied() throws Exception {
    String path="/api/v1/inventories/"+UUID.randomUUID()+"/stock/reserve";
    String body="{\"quantity\":1,\"reason\":\"forged reservation\"}";
    mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isUnauthorized());
    for(String token:java.util.List.of("invalid","expired")) mvc.perform(post(path).header("Authorization","Bearer "+token).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isUnauthorized());
    for(String token:java.util.List.of("customer","manager")) {
      mvc.perform(post(path).header("Authorization","Bearer "+token).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
      mvc.perform(put("/api/v1/inventories/"+UUID.randomUUID()).header("Authorization","Bearer "+token).contentType(MediaType.APPLICATION_JSON)
        .content("{\"availableQuantity\":100,\"reservedQuantity\":0,\"reorderLevel\":0,\"status\":\"ACTIVE\"}")).andExpect(status().isForbidden());
    }
    mvc.perform(post("/internal/events").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
  }

  @Test void concurrentUpdatesRecordExactlyOneMovementEachInPersistentOrder() throws Exception {
    var inventory = inventories.create(new com.metaarch.inventory.inventory.InventoryRequest(
      UUID.randomUUID(), null, "concurrent-store", 0, 0, 0,
      com.metaarch.inventory.inventory.InventoryStatus.ACTIVE));
    var executor = java.util.concurrent.Executors.newFixedThreadPool(4);
    try {
      var tasks = new java.util.ArrayList<java.util.concurrent.Callable<Void>>();
      for (int i = 0; i < 12; i++) tasks.add(() -> {
        stock.increase(inventory.id(), new com.metaarch.inventory.movement.StockAdjustmentRequest(1, "concurrent receipt"));
        return null;
      });
      for (var future : executor.invokeAll(tasks)) future.get();
    } finally { executor.shutdownNow(); }
    org.junit.jupiter.api.Assertions.assertEquals(12, inventories.get(inventory.id()).availableQuantity());
    var page = movements.findByInventoryId(inventory.id(), org.springframework.data.domain.PageRequest.of(0, 30,
      org.springframework.data.domain.Sort.by("createdAt").descending()));
    org.junit.jupiter.api.Assertions.assertEquals(12, page.getTotalElements());
    org.junit.jupiter.api.Assertions.assertEquals(12, page.stream().map(m -> m.getId()).distinct().count());
    var rows = page.getContent();
    for (int i = 1; i < rows.size(); i++)
      org.junit.jupiter.api.Assertions.assertTrue(rows.get(i - 1).getCreatedAt().isAfter(rows.get(i).getCreatedAt()));
    // The next transaction must advance beyond the committed history.
    var persistedLatest = rows.get(0).getCreatedAt();
    stock.increase(inventory.id(), new com.metaarch.inventory.movement.StockAdjustmentRequest(1, "later receipt"));
    org.junit.jupiter.api.Assertions.assertTrue(movements.findFirstByInventoryIdOrderByCreatedAtDesc(inventory.id())
      .orElseThrow().getCreatedAt().isAfter(persistedLatest));
  }

 @Test
 void inventoryLifecycleAndStockMovements() throws Exception {
    String productId = UUID.randomUUID().toString();
    String variantId = UUID.randomUUID().toString();
    JsonNode inventory = json.readTree(mvc.perform(post("/api/v1/inventories").header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"productId":"%s","variantId":"%s","storeId":"store-1","availableQuantity":10,"reservedQuantity":0,"reorderLevel":2,"status":"ACTIVE"}
      """.formatted(productId, variantId))).andExpect(status().isCreated()).andExpect(jsonPath("$.availableQuantity").value(10)).andReturn().getResponse().getContentAsString());
    String inventoryId = inventory.get("id").asText();

    mvc.perform(get("/api/v1/inventories").header("Authorization","Bearer admin").param("productId", productId).param("variantId", variantId).param("storeId", "store-1"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(inventoryId));
    mvc.perform(put("/api/v1/inventories/{id}", inventoryId).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"availableQuantity":10,"reservedQuantity":0,"reorderLevel":3,"status":"ACTIVE"}
      """)).andExpect(status().isOk()).andExpect(jsonPath("$.reorderLevel").value(3));
    mvc.perform(post("/api/v1/inventories/{id}/stock/increase", inventoryId).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"quantity":5,"reason":"purchase order received"}
      """)).andExpect(status().isOk()).andExpect(jsonPath("$.availableQuantity").value(15));
    mvc.perform(post("/api/v1/inventories/{id}/stock/reserve", inventoryId).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"quantity":4,"reason":"checkout hold"}
      """)).andExpect(status().isOk()).andExpect(jsonPath("$.availableQuantity").value(11)).andExpect(jsonPath("$.reservedQuantity").value(4));
    mvc.perform(post("/api/v1/inventories/{id}/stock/release", inventoryId).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"quantity":1,"reason":"cart expired"}
      """)).andExpect(status().isOk()).andExpect(jsonPath("$.availableQuantity").value(12)).andExpect(jsonPath("$.reservedQuantity").value(3));
    mvc.perform(post("/api/v1/inventories/{id}/stock/decrease", inventoryId).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"quantity":2,"reason":"manual correction"}
      """)).andExpect(status().isOk()).andExpect(jsonPath("$.availableQuantity").value(10));

    mvc.perform(get("/api/v1/inventories/{id}/movements", inventoryId).header("Authorization","Bearer admin"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(4)).andExpect(jsonPath("$.content[0].movementType").value("DECREASE"));
  }

 @Test
 void rejectsDuplicatesInvalidRequestsAndInsufficientStock() throws Exception {
    String productId = UUID.randomUUID().toString();
    JsonNode inventory = json.readTree(mvc.perform(post("/api/v1/inventories").header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"productId":"%s","storeId":"store-2","availableQuantity":1,"reservedQuantity":0,"reorderLevel":0,"status":"ACTIVE"}
      """.formatted(productId))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    String inventoryId = inventory.get("id").asText();

    mvc.perform(post("/api/v1/inventories").header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"productId":"%s","storeId":"store-2","availableQuantity":1,"reservedQuantity":0,"reorderLevel":0,"status":"ACTIVE"}
      """.formatted(productId))).andExpect(status().isConflict());
    mvc.perform(post("/api/v1/inventories/{id}/stock/decrease", inventoryId).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"quantity":2,"reason":"oversell attempt"}
      """)).andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("Insufficient available stock"));
    mvc.perform(post("/api/v1/inventories/{id}/stock/increase", inventoryId).header("Authorization","Bearer admin").contentType(MediaType.APPLICATION_JSON).content("""
      {"quantity":0,"reason":"bad adjustment"}
      """)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.quantity").exists());
  }
}
