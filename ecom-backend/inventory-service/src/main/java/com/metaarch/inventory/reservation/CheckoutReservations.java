package com.metaarch.inventory.reservation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.sync.CheckoutInventoryEvent;
import com.metaarch.sync.SyncAuthentication;
import java.nio.ByteBuffer;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CheckoutReservations {
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  public CheckoutReservations(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc=jdbc; this.mapper=mapper; }

  @Transactional
  public String apply(CheckoutInventoryEvent event) {
    if (event==null || event.action()==null || event.orderId()==null || event.childId()==null || event.customerId()==null || event.storeId()==null
        || event.storeId().isBlank() || event.lines()==null || event.lines().isEmpty()
        || !Set.of("RESERVE","RELEASE","CONFIRM").contains(event.action())) throw new IllegalArgumentException("Invalid reservation command");
    var sorted=event.lines().stream().sorted(Comparator.comparing(line -> line.productId()+":"+line.variantId())).toList();
    Set<String> identities=new HashSet<>();
    for (var line : sorted) {
      if (line.productId()==null || line.quantity()<1 || !identities.add(line.productId()+":"+line.variantId())) throw new IllegalArgumentException("Invalid reservation line");
    }
    String hash;
    try { hash=SyncAuthentication.digest(mapper.writeValueAsBytes(List.of(event.orderId(),event.customerId(),event.storeId(),sorted))); }
    catch (Exception failure) { throw new IllegalArgumentException("Cannot serialize reservation",failure); }
    // Serializes new identities too, and orders stock locks consistently across processes.
    jdbc.queryForObject("SELECT id FROM checkout_reservation_lock WHERE id=1 FOR UPDATE",Integer.class);
    var rows=jdbc.queryForList("SELECT request_hash,state FROM checkout_reservations WHERE child_id=?",event.childId().toString());
    if (!rows.isEmpty()) {
      if (!hash.equals(rows.getFirst().get("request_hash"))) throw new IllegalArgumentException("Reservation identity content changed");
      String state=rows.getFirst().get("state").toString();
      if (!"RESERVED".equals(state) || "RESERVE".equals(event.action())) return state;
      return finish(event.childId(),state,event.action());
    }
    if ("CONFIRM".equals(event.action())) throw new IllegalArgumentException("Cannot confirm unknown reservation");
    // A release tombstone prevents a delayed RESERVE from taking stock after compensation.
    String state="RELEASE".equals(event.action()) ? "RELEASED" : "RESERVED";
    var stock=new ArrayList<Stock>();
    if ("RESERVED".equals(state)) {
      for (var line : sorted) {
        var found=jdbc.query("SELECT id,available_quantity,status FROM inventories WHERE product_id=? AND variant_key=? AND store_id=? FOR UPDATE",
            (rs,index) -> new Stock(rs.getBytes(1),line.quantity(),rs.getInt(2),rs.getString(3)), bytes(line.productId()),bytes(line.variantId()==null?new UUID(0,0):line.variantId()),event.storeId());
        if (found.size()!=1 || found.getFirst().available()<line.quantity() || "INACTIVE".equals(found.getFirst().status())) { state="REJECTED"; break; }
        stock.add(found.getFirst());
      }
    }
    jdbc.update("INSERT INTO checkout_reservations(child_id,checkout_id,customer_id,store_id,request_hash,state) VALUES (?,?,?,?,?,?)",
        event.childId().toString(),event.orderId().toString(),event.customerId().toString(),event.storeId(),hash,state);
    if ("RESERVED".equals(state)) {
      for (var line : stock) {
        int updated=jdbc.update("UPDATE inventories SET status=CASE WHEN available_quantity=? THEN 'OUT_OF_STOCK' ELSE status END, available_quantity=available_quantity-?, reserved_quantity=reserved_quantity+?, version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND available_quantity>=? AND status<>'INACTIVE'",
            line.quantity(),line.quantity(),line.quantity(),line.id(),line.quantity());
        if (updated!=1) throw new IllegalStateException("Inventory changed during reservation");
        jdbc.update("INSERT INTO checkout_reservation_lines(child_id,inventory_id,quantity) VALUES (?,?,?)",event.childId().toString(),line.id(),line.quantity());
      }
    }
    audit(event.childId(),null,state);
    return state;
  }

  private String finish(UUID child,String previous,String action) {
    String next="RELEASE".equals(action)?"RELEASED":"CONFIRMED";
    var lines=jdbc.query("SELECT inventory_id,quantity FROM checkout_reservation_lines WHERE child_id=? ORDER BY inventory_id",(rs,i)->new Stock(rs.getBytes(1),rs.getInt(2),0,""),child.toString());
    for (var line:lines) {
      String sql="RELEASED".equals(next)
          ? "UPDATE inventories SET status=CASE WHEN status='OUT_OF_STOCK' THEN 'ACTIVE' ELSE status END, available_quantity=available_quantity+?, reserved_quantity=reserved_quantity-?, version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND reserved_quantity>=?"
          : "UPDATE inventories SET reserved_quantity=reserved_quantity-?, version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND reserved_quantity>=?";
      int updated="RELEASED".equals(next)?jdbc.update(sql,line.quantity(),line.quantity(),line.id(),line.quantity()):jdbc.update(sql,line.quantity(),line.id(),line.quantity());
      if(updated!=1) throw new IllegalStateException("Reserved stock invariant violated");
    }
    jdbc.update("UPDATE checkout_reservations SET state=?, updated_at=CURRENT_TIMESTAMP WHERE child_id=?",next,child.toString());
    audit(child,previous,next);
    return next;
  }

  @Transactional
  public void resumeReplies(CheckoutInventoryEvent command) {
    // Called after apply validates the durable identity, within the signed inbox transaction.
    var rows=jdbc.queryForList("SELECT state FROM checkout_reservations WHERE child_id=? AND checkout_id=? AND customer_id=? AND store_id=?",
        command.childId().toString(),command.orderId().toString(),command.customerId().toString(),command.storeId());
    if(rows.size()!=1) throw new IllegalArgumentException("Reservation recovery ownership mismatch");
    int resumed=jdbc.update("UPDATE sync_outbox SET state='PENDING',attempts=0,next_attempt=?,lease_token=NULL,lease_until=NULL,last_error=NULL WHERE aggregate_id=? AND target='order-service' AND state='DEAD'",
        System.currentTimeMillis(),command.orderId().toString());
    if(resumed>0) audit(command.childId(),rows.getFirst().get("state").toString(),rows.getFirst().get("state").toString());
  }

  private void audit(UUID child,String previous,String next) {
    jdbc.update("INSERT INTO checkout_reservation_audit(id,child_id,previous_state,next_state) VALUES (?,?,?,?)",UUID.randomUUID().toString(),child.toString(),previous,next);
  }
  private record Stock(byte[] id,int quantity,int available,String status) { }
  static byte[] bytes(UUID id) { return ByteBuffer.allocate(16).putLong(id.getMostSignificantBits()).putLong(id.getLeastSignificantBits()).array(); }
}
