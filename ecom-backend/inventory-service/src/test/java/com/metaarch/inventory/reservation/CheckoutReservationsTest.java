package com.metaarch.inventory.reservation;

import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.sync.CheckoutInventoryEvent;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.support.TransactionTemplate;

class CheckoutReservationsTest {
  JdbcTemplate jdbc;
  CheckoutReservations reservations;
  TransactionTemplate transaction;
  UUID product=UUID.randomUUID(), variant=UUID.randomUUID(), inventory=UUID.randomUUID();

  @BeforeEach void setup() {
    var source=new DriverManagerDataSource("jdbc:h2:mem:"+UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");
    jdbc=new JdbcTemplate(source);
    transaction=new TransactionTemplate(new DataSourceTransactionManager(source));
    jdbc.execute("CREATE TABLE inventories(id BINARY(16) PRIMARY KEY,product_id BINARY(16),variant_key BINARY(16),store_id VARCHAR(100),available_quantity INT,reserved_quantity INT,status VARCHAR(24),version BIGINT,updated_at TIMESTAMP)");
    new ResourceDatabasePopulator(new ClassPathResource("db/migration/V6__checkout_reservations.sql")).execute(source);
    jdbc.update("INSERT INTO inventories VALUES (?,?,?,?,5,0,'ACTIVE',0,CURRENT_TIMESTAMP)",CheckoutReservations.bytes(inventory),CheckoutReservations.bytes(product),CheckoutReservations.bytes(variant),"a");
    reservations=new CheckoutReservations(jdbc,new ObjectMapper().findAndRegisterModules());
  }
  CheckoutInventoryEvent command(UUID group,UUID child,String store,String action,int quantity) {
    return new CheckoutInventoryEvent(UUID.randomUUID(),group,new UUID(0,1),child,store,action,List.of(new CheckoutInventoryEvent.Line(product,variant,quantity)),null);
  }
  CheckoutInventoryEvent action(CheckoutInventoryEvent command,String action) {
    return new CheckoutInventoryEvent(UUID.randomUUID(),command.orderId(),command.customerId(),command.childId(),command.storeId(),action,command.lines(),null);
  }
  String apply(CheckoutInventoryEvent command) { return transaction.execute(status->reservations.apply(command)); }
  int quantity(String column) { return jdbc.queryForObject("SELECT "+column+" FROM inventories WHERE id=?",Integer.class,CheckoutReservations.bytes(inventory)); }

  @Test void reservesOnceAcrossRetriesAndServiceReconstruction() {
    var command=command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",3);
    assertThat(apply(command)).isEqualTo("RESERVED");
    reservations=new CheckoutReservations(jdbc,new ObjectMapper().findAndRegisterModules());
    assertThat(apply(action(command,"RESERVE"))).isEqualTo("RESERVED");
    assertThat(quantity("available_quantity")).isEqualTo(2);
    assertThat(quantity("reserved_quantity")).isEqualTo(3);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_reservation_audit",Integer.class)).isEqualTo(1);
  }
  @Test void recoveryResumesOnlyValidatedGroupRepliesWithoutTakingStockAgain() {
    jdbc.execute("CREATE TABLE sync_outbox(id BIGINT AUTO_INCREMENT PRIMARY KEY,aggregate_id VARCHAR(36),target VARCHAR(100),state VARCHAR(32),attempts INT,next_attempt BIGINT,lease_token VARCHAR(36),lease_until BIGINT,last_error VARCHAR(100))");
    var command=command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",3);
    apply(command);
    String other=UUID.randomUUID().toString();
    jdbc.update("INSERT INTO sync_outbox(aggregate_id,target,state,attempts) VALUES (?,'order-service','DEAD',9)",command.orderId().toString());
    jdbc.update("INSERT INTO sync_outbox(aggregate_id,target,state,attempts) VALUES (?,'order-service','DEAD',9)",other);
    transaction.executeWithoutResult(status->{reservations.apply(action(command,"RESERVE"));reservations.resumeReplies(command);});
    assertThat(jdbc.queryForObject("SELECT state FROM sync_outbox WHERE aggregate_id=?",String.class,command.orderId().toString())).isEqualTo("PENDING");
    assertThat(jdbc.queryForObject("SELECT state FROM sync_outbox WHERE aggregate_id=?",String.class,other)).isEqualTo("DEAD");
    long audits=jdbc.queryForObject("SELECT COUNT(*) FROM checkout_reservation_audit",Long.class);
    transaction.executeWithoutResult(status->reservations.resumeReplies(command));
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_reservation_audit",Long.class)).isEqualTo(audits);
    assertThat(quantity("available_quantity")).isEqualTo(2);
    assertThat(quantity("reserved_quantity")).isEqualTo(3);
    assertThatThrownBy(()->transaction.executeWithoutResult(status->reservations.resumeReplies(new CheckoutInventoryEvent(UUID.randomUUID(),command.orderId(),UUID.randomUUID(),command.childId(),"a","RESERVE",command.lines(),null)))).isInstanceOf(IllegalArgumentException.class);
  }
  @Test void releaseIsIdempotentAndLateReserveCannotReacquireStock() {
    var command=command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",3);
    apply(command);
    assertThat(apply(action(command,"RELEASE"))).isEqualTo("RELEASED");
    assertThat(apply(action(command,"RELEASE"))).isEqualTo("RELEASED");
    assertThat(apply(action(command,"RESERVE"))).isEqualTo("RELEASED");
    assertThat(apply(action(command,"CONFIRM"))).isEqualTo("RELEASED");
    assertThat(quantity("available_quantity")).isEqualTo(5);
    assertThat(quantity("reserved_quantity")).isZero();
  }
  @Test void releaseBeforeReserveCreatesTombstoneWithoutTakingStock() {
    var command=command(UUID.randomUUID(),UUID.randomUUID(),"a","RELEASE",3);
    assertThat(apply(command)).isEqualTo("RELEASED");
    assertThat(apply(action(command,"RESERVE"))).isEqualTo("RELEASED");
    assertThat(quantity("available_quantity")).isEqualTo(5);
  }
  @Test void confirmedStockCannotBeAccidentallyReleased() {
    var command=command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",3);
    apply(command);
    assertThat(apply(action(command,"CONFIRM"))).isEqualTo("CONFIRMED");
    assertThat(apply(action(command,"CONFIRM"))).isEqualTo("CONFIRMED");
    assertThat(apply(action(command,"RELEASE"))).isEqualTo("CONFIRMED");
    assertThat(quantity("available_quantity")).isEqualTo(2);
    assertThat(quantity("reserved_quantity")).isZero();
  }
  @Test void rejectsInsufficientStockAndWrongStoreWithoutPartialChanges() {
    assertThat(apply(command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",6))).isEqualTo("REJECTED");
    assertThat(apply(command(UUID.randomUUID(),UUID.randomUUID(),"other","RESERVE",1))).isEqualTo("REJECTED");
    assertThat(quantity("available_quantity")).isEqualTo(5);
    assertThat(quantity("reserved_quantity")).isZero();
  }
  @Test void rejectsChangedQuantityIdentityAndUnknownConfirmation() {
    var command=command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",3);
    apply(command);
    assertThatThrownBy(()->apply(command(command.orderId(),command.childId(),"a","RESERVE",4))).hasMessage("Reservation identity content changed");
    assertThatThrownBy(()->apply(command(UUID.randomUUID(),UUID.randomUUID(),"a","CONFIRM",1))).hasMessage("Cannot confirm unknown reservation");
    assertThat(quantity("available_quantity")).isEqualTo(2);
  }
  @Test void concurrentGroupsCannotOversell() throws Exception {
    var executor=Executors.newFixedThreadPool(2);
    try {
      var first=executor.submit(()->apply(command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",4)));
      var second=executor.submit(()->apply(command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",4)));
      assertThat(List.of(first.get(20,TimeUnit.SECONDS),second.get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder("RESERVED","REJECTED");
      assertThat(quantity("available_quantity")).isEqualTo(1);
      assertThat(quantity("reserved_quantity")).isEqualTo(4);
    } finally { executor.shutdownNow(); }
  }
  @Test void transactionFailureDoesNotLeaveReservationOrStockChange() {
    var command=command(UUID.randomUUID(),UUID.randomUUID(),"a","RESERVE",3);
    assertThatThrownBy(()->transaction.execute(status->{ reservations.apply(command);throw new IllegalStateException("Injected failure"); })).isInstanceOf(IllegalStateException.class);
    assertThat(quantity("available_quantity")).isEqualTo(5);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_reservations",Integer.class)).isZero();
    assertThat(apply(command)).isEqualTo("RESERVED");
  }
}
