package com.metaarch.order.order;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.sync.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@ConditionalOnProperty(name="checkout.multi-store.enabled",havingValue="true")
public class CheckoutCoordinator {
  private final CheckoutGroups groups;
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final CheckoutCartClient carts;
  private final OrderService orders;
  private final DurableEvents events;
  private final TransactionTemplate transactions;

  public CheckoutCoordinator(CheckoutGroups groups,JdbcTemplate jdbc,ObjectMapper mapper,
      CheckoutCartClient carts,OrderService orders,DurableEvents events,PlatformTransactionManager manager) {
    this.groups=groups;this.jdbc=jdbc;this.mapper=mapper;this.carts=carts;this.orders=orders;this.events=events;
    transactions=new TransactionTemplate(manager);
  }

  public CheckoutGroups.Result submit(String key,List<CreateOrderRequest> requests) {
    var group=groups.prepare(key,requests);
    transactions.executeWithoutResult(status->{
      lock();
      var current=groups.get(group.id());
      if (!"PREPARED".equals(current.state())) return;
      var saved=payload(group.id());
      // Verify all prices and quotes before any remote cart claim or reservation command.
      for(var request:saved) verifyQuote(request,orders.preview(request));
      for(var request:saved) {
        UUID reservation=UUID.nameUUIDFromBytes((group.id()+":"+request.storeId()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        jdbc.update("UPDATE checkout_children SET reservation_id=? WHERE checkout_id=? AND store_id=?",reservation.toString(),group.id().toString(),request.storeId());
        carts.claim(request,digest(group.id(),request));
      }
      transition(group.id(),"PREPARED","RESERVING",group.customerId());
      commandAll(group.id(),"RESERVE");
    });
    return groups.get(group.id());
  }

  @org.springframework.transaction.annotation.Transactional
  public CheckoutGroups.Result retry(UUID id) {
    lock();
    var group=groups.get(id);
    if(Set.of("COMPLETED","FAILED").contains(group.state())) return group;
    if("PREPARED".equals(group.state())) return submit(jdbc.queryForObject("SELECT request_key FROM checkout_groups WHERE id=?",String.class,id.toString()),payload(id));
    int updated=jdbc.update("UPDATE sync_outbox SET state='PENDING',attempts=0,next_attempt=?,lease_token=NULL,lease_until=NULL,last_error=NULL WHERE aggregate_id=? AND target='inventory-service' AND state='DEAD'",System.currentTimeMillis(),id.toString());
    if(updated>0) transition(id,group.state(),group.state(),group.customerId());
    commandAll(id,switch(group.state()) { case "RESERVING" -> "RESERVE"; case "COMMITTING" -> "CONFIRM"; case "COMPENSATING" -> "RELEASE"; default -> throw new IllegalStateException("Unsupported checkout recovery state"); });
    return groups.get(id);
  }

  // Invoked only by the authenticated inventory event receiver in its inbox transaction.
  @org.springframework.transaction.annotation.Transactional
  public void receive(CheckoutInventoryEvent reply) {
    lock();
    var rows=jdbc.queryForList("SELECT customer_id,state FROM checkout_groups WHERE id=?",reply.orderId().toString());
    if(rows.size()!=1 || !reply.customerId().toString().equals(rows.getFirst().get("customer_id"))) throw new IllegalArgumentException("Unknown checkout inventory reply");
    String state=rows.getFirst().get("state").toString();
    var requests=payload(reply.orderId());
    var request=requests.stream().filter(item->item.storeId().equals(reply.storeId())).findFirst().orElseThrow(()->new IllegalArgumentException("Unknown checkout store"));
    var child=jdbc.queryForList("SELECT reservation_id,state FROM checkout_children WHERE checkout_id=? AND store_id=?",reply.orderId().toString(),reply.storeId()).getFirst();
    if (!reply.childId().toString().equals(child.get("reservation_id")) || !lines(request).equals(reply.lines())) throw new IllegalArgumentException("Inventory reply content mismatch");
    if(Set.of("COMPLETED","FAILED").contains(state)) return;
    if("COMPENSATING".equals(state)) {
      if(Set.of("RELEASED","REJECTED").contains(reply.state())) {
        jdbc.update("UPDATE checkout_children SET state='RELEASED' WHERE checkout_id=? AND store_id=?",reply.orderId().toString(),reply.storeId());
        if(count(reply.orderId(),"RELEASED")==requests.size()) transition(reply.orderId(),state,"FAILED",reply.customerId());
      }
      return;
    }
    if("RESERVING".equals(state) && "RESERVE".equals(reply.action())) {
      if(!"RESERVED".equals(reply.state())) {
        transition(reply.orderId(),state,"COMPENSATING",reply.customerId());
        commandAll(reply.orderId(),"RELEASE");
        return;
      }
      jdbc.update("UPDATE checkout_children SET state='RESERVED' WHERE checkout_id=? AND store_id=?",reply.orderId().toString(),reply.storeId());
      if(count(reply.orderId(),"RESERVED")!=requests.size()) return;
      // If availability/pricing changed, compensate before creating any child.
      try { for(var item:requests) verifyQuote(item,orders.preview(item)); }
      catch(com.metaarch.order.exception.DeliveryQuoteVerificationException | IllegalArgumentException failure) {
        transition(reply.orderId(),state,"COMPENSATING",reply.customerId());
        commandAll(reply.orderId(),"RELEASE");
        return;
      }
      transition(reply.orderId(),state,"COMMITTING",reply.customerId());
      BigDecimal total=BigDecimal.ZERO;
      for(var item:requests) {
        var order=orders.create(item);
        jdbc.update("UPDATE checkout_children SET order_id=? WHERE checkout_id=? AND store_id=?",order.id().toString(),reply.orderId().toString(),item.storeId());
        total=total.add(order.totalAmount());
      }
      jdbc.update("UPDATE checkout_groups SET aggregate_total=? WHERE id=?",total,reply.orderId().toString());
      commandAll(reply.orderId(),"CONFIRM");
    } else if("COMMITTING".equals(state) && "CONFIRM".equals(reply.action()) && "CONFIRMED".equals(reply.state())) {
      jdbc.update("UPDATE checkout_children SET state='CONFIRMED' WHERE checkout_id=? AND store_id=?",reply.orderId().toString(),reply.storeId());
      if(count(reply.orderId(),"CONFIRMED")==requests.size()) transition(reply.orderId(),state,"COMPLETED",reply.customerId());
    }
  }

  private void verifyQuote(CreateOrderRequest request,OrderResponse quote) {
    if(request.deliveryCharge()!=null && request.deliveryCharge().compareTo(quote.deliveryCharge())!=0) throw new IllegalArgumentException("Delivery quote changed; refresh checkout");
  }
  private void commandAll(UUID group,String action) {
    for(var item:payload(group)) {
      String child=jdbc.queryForObject("SELECT reservation_id FROM checkout_children WHERE checkout_id=? AND store_id=?",String.class,group.toString(),item.storeId());
      UUID event=UUID.randomUUID();
      events.publish(event,"checkout-reservation",group.toString(),new CheckoutInventoryEvent(event,group,item.customerId(),UUID.fromString(child),item.storeId(),action,lines(item),null));
    }
  }
  private List<CheckoutInventoryEvent.Line> lines(CreateOrderRequest request) {
    return request.items().stream().map(item->new CheckoutInventoryEvent.Line(item.productId(),item.variantId(),item.quantity())).toList();
  }
  private List<CreateOrderRequest> payload(UUID group) {
    try { return mapper.readValue(jdbc.queryForObject("SELECT request_payload FROM checkout_groups WHERE id=?",String.class,group.toString()),new TypeReference<List<CreateOrderRequest>>(){}); }
    catch(Exception failure) { throw new IllegalStateException("Checkout snapshot unreadable",failure); }
  }
  private String digest(UUID group,CreateOrderRequest request) {
    try {return SyncAuthentication.digest(mapper.writeValueAsBytes(List.of(group,request)));}
    catch(Exception failure){throw new IllegalStateException("Checkout snapshot unreadable",failure);}
  }
  private int count(UUID group,String state) { return jdbc.queryForObject("SELECT COUNT(*) FROM checkout_children WHERE checkout_id=? AND state=?",Integer.class,group.toString(),state); }
  private void lock() { jdbc.queryForObject("SELECT id FROM sync_receiver_lock WHERE id=1 FOR UPDATE",Integer.class); }
  private void transition(UUID group,String previous,String next,UUID owner) {
    if(!CheckoutGroupState.valueOf(previous).canTransitionTo(CheckoutGroupState.valueOf(next))) throw new IllegalStateException("Invalid checkout transition");
    jdbc.update("UPDATE checkout_groups SET state=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",next,group.toString());
    jdbc.update("INSERT INTO checkout_audit(id,checkout_id,previous_state,next_state,actor) VALUES (?,?,?,?,?)",UUID.randomUUID().toString(),group.toString(),previous,next,owner.toString());
  }
}
