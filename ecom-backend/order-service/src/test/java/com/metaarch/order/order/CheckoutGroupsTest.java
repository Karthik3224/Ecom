package com.metaarch.order.order;

import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.support.TransactionTemplate;

class CheckoutGroupsTest {
  private JdbcTemplate jdbc;
  private CheckoutGroups groups;
  private TransactionTemplate transaction;
  private final UUID owner = UUID.randomUUID();
  private final String key = "checkout-retry-key-0001";
  private ObjectMapper mapper;

  @BeforeEach void setup() {
    var source = new DriverManagerDataSource("jdbc:h2:mem:" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1", "sa", "");
    jdbc = new JdbcTemplate(source);
    transaction = new TransactionTemplate(new DataSourceTransactionManager(source));
    mapper = new ObjectMapper().findAndRegisterModules();
    groups = new CheckoutGroups(jdbc, mapper, null);
    jdbc.execute("CREATE TABLE sync_receiver_lock(id INT PRIMARY KEY)");
    jdbc.update("INSERT INTO sync_receiver_lock VALUES (1)");
    jdbc.execute("CREATE TABLE sync_outbox(aggregate_id VARCHAR(128),target VARCHAR(64),state VARCHAR(16))");
    jdbc.execute("CREATE TABLE checkout_groups(id VARCHAR(36) PRIMARY KEY, customer_id VARCHAR(36), request_key VARCHAR(128), request_hash VARCHAR(64), request_payload CLOB, state VARCHAR(32), handling_policy VARCHAR(32), aggregate_total DECIMAL(19,2), UNIQUE(customer_id,request_key))");
    jdbc.execute("CREATE TABLE checkout_children(checkout_id VARCHAR(36), store_id VARCHAR(100), cart_id VARCHAR(36) UNIQUE, order_id VARCHAR(36) UNIQUE, reservation_id VARCHAR(36) NOT NULL UNIQUE, state VARCHAR(32), handling_fee DECIMAL(19,2), updated_at TIMESTAMP, PRIMARY KEY(checkout_id,store_id), FOREIGN KEY(checkout_id) REFERENCES checkout_groups(id))");
    jdbc.execute("CREATE TABLE checkout_audit(id VARCHAR(36) PRIMARY KEY, checkout_id VARCHAR(36), previous_state VARCHAR(32), next_state VARCHAR(32), actor VARCHAR(36), FOREIGN KEY(checkout_id) REFERENCES checkout_groups(id))");
    authenticate(owner);
  }

  @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }

  private void authenticate(UUID customer) {
    var token = Jwt.withTokenValue("verified-test-context").header("alg", "HS256").claim("customerId", customer.toString()).subject(customer.toString()).build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token, List.of()));
  }

  private CreateOrderRequest request(String store, UUID cart, UUID customer) throws Exception {
    return mapper.readValue(mapper.writeValueAsString(Map.of("customerId", customer, "cartId", cart, "storeId", store,
        "items", List.of(Map.of("productId", UUID.randomUUID(), "productName", "Test item", "quantity", 1, "unitPrice", 10)))), CreateOrderRequest.class);
  }

  private CheckoutGroups.Result prepare(String retry, List<CreateOrderRequest> requests) {
    return transaction.execute(status -> groups.prepare(retry, requests));
  }

  @Test void persistsOwnerGroupAndPerStoreFeeWithoutInventingTotalsOrOrders() throws Exception {
    var result = prepare(key, List.of(request("store-b", UUID.randomUUID(), owner), request("store-a", UUID.randomUUID(), owner)));
    assertThat(result.customerId()).isEqualTo(owner);
    assertThat(result.state()).isEqualTo("PREPARED");
    assertThat(result.aggregateTotal()).isNull();
    assertThat(result.children()).hasSize(2).allSatisfy(child -> {
      assertThat(child.handlingFee()).isEqualByComparingTo("5.00");
      assertThat(child.orderId()).isNull();
    });
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_audit", Integer.class)).isEqualTo(1);
  }

  @Test void reorderedDuplicateIsSameGroupAndDoesNotDuplicateAudit() throws Exception {
    var a = request("a", UUID.randomUUID(), owner);
    var b = request("b", UUID.randomUUID(), owner);
    var first = prepare(key, List.of(a, b));
    assertThat(prepare(key, List.of(b, a)).id()).isEqualTo(first.id());
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_groups", Integer.class)).isEqualTo(1);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_audit", Integer.class)).isEqualTo(1);
  }

  @Test void changedRetryAndSecondKeyForClaimedCartAreRejected() throws Exception {
    var request = request("a", UUID.randomUUID(), owner);
    prepare(key, List.of(request));
    assertThatThrownBy(() -> prepare(key, List.of(request("b", UUID.randomUUID(), owner)))).hasMessage("Checkout retry content changed");
    assertThatThrownBy(() -> prepare("checkout-retry-key-0002", List.of(request))).hasMessage("Cart belongs to an existing checkout");
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_groups", Integer.class)).isEqualTo(1);
  }

  @Test void foreignOwnerAndUnauthenticatedReadsAndWritesAreDenied() throws Exception {
    var request = request("a", UUID.randomUUID(), owner);
    var result = prepare(key, List.of(request));
    authenticate(UUID.randomUUID());
    assertThatThrownBy(() -> groups.get(result.id())).isInstanceOf(AccessDeniedException.class);
    assertThatThrownBy(() -> prepare(key, List.of(request))).isInstanceOf(AccessDeniedException.class);
    SecurityContextHolder.clearContext();
    assertThatThrownBy(() -> groups.get(result.id())).isInstanceOf(AccessDeniedException.class);
    assertThatThrownBy(() -> prepare(key, List.of(request))).isInstanceOf(AccessDeniedException.class);
  }

  @Test void duplicateStoreOrCartCannotProducePartialGroup() throws Exception {
    var a = request("a", UUID.randomUUID(), owner);
    assertThatThrownBy(() -> prepare(key, List.of(a, request("a", UUID.randomUUID(), owner)))).isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> prepare(key, List.of(a, request("b", a.cartId(), owner)))).isInstanceOf(IllegalArgumentException.class);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_groups", Integer.class)).isZero();
  }

  @Test void retryLookupIsOwnerScopedAndRequiresAuthentication() throws Exception {
    var result = prepare(key, List.of(request("a", UUID.randomUUID(), owner)));
    assertThat(groups.getByKey(key).id()).isEqualTo(result.id());
    authenticate(UUID.randomUUID());
    assertThatThrownBy(() -> groups.getByKey(key))
        .isInstanceOf(com.metaarch.order.exception.ResourceNotFoundException.class)
        .hasMessage("Checkout attempt not found");
    SecurityContextHolder.clearContext();
    assertThatThrownBy(() -> groups.getByKey(key)).isInstanceOf(AccessDeniedException.class);
  }

  @Test void concurrentRetriesReturnOneDurableGroupAfterServiceReconstruction() throws Exception {
    var requests = List.of(request("a", UUID.randomUUID(), owner), request("b", UUID.randomUUID(), owner));
    var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
    var ready = new java.util.concurrent.CountDownLatch(2);
    try {
      java.util.concurrent.Callable<UUID> submit = () -> {
        authenticate(owner);
        try {
          ready.countDown();
          if (!ready.await(5, java.util.concurrent.TimeUnit.SECONDS)) throw new AssertionError("Concurrent callers not ready");
          return prepare(key, requests).id();
        } finally { SecurityContextHolder.clearContext(); }
      };
      var first = executor.submit(submit);
      var second = executor.submit(submit);
      UUID id = first.get(10, java.util.concurrent.TimeUnit.SECONDS);
      assertThat(second.get(10, java.util.concurrent.TimeUnit.SECONDS)).isEqualTo(id);
      groups = new CheckoutGroups(jdbc, mapper, null);
      assertThat(prepare(key, requests).id()).isEqualTo(id);
      assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_children", Integer.class)).isEqualTo(2);
      assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_audit", Integer.class)).isEqualTo(1);
    } finally { executor.shutdownNow(); }
  }

  @Test void databaseFailureRollsBackGroupChildrenAndAuditTogether() throws Exception {
    var requests = List.of(request("a", UUID.randomUUID(), owner));
    assertThatThrownBy(() -> transaction.execute(status -> {
      groups.prepare(key, requests);
      throw new IllegalStateException("Injected database transaction failure");
    })).isInstanceOf(IllegalStateException.class);
    for (String table : List.of("checkout_groups", "checkout_children", "checkout_audit")) {
      assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class)).isZero();
    }
    assertThat(prepare(key, requests).children()).hasSize(1);
  }
}
