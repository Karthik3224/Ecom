package com.metaarch.fulfillment.fulfillment;

import com.metaarch.sync.PublicApiSecurity;
import com.metaarch.fulfillment.shipment.ShipmentRepository;
import java.util.UUID;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component("fulfillmentAccess")
@Import(PublicApiSecurity.class)
@Transactional(readOnly=true)
public class FulfillmentAccess {
  private final FulfillmentRepository fulfillments;
  private final ShipmentRepository shipments;
  private final com.metaarch.fulfillment.event.FulfillmentOrderSnapshotRepository snapshots;
  public FulfillmentAccess(FulfillmentRepository fulfillments, ShipmentRepository shipments, com.metaarch.fulfillment.event.FulfillmentOrderSnapshotRepository snapshots) { this.fulfillments=fulfillments;this.shipments=shipments;this.snapshots=snapshots; }
  public boolean admin() {return PublicApiSecurity.administrator();}
  public String partnerId() {
    var auth=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    if (!(auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken token)
        || "customer".equals(token.getToken().getClaimAsString("accountType"))
        || token.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DELIVERY_PARTNER"))) return null;
    String id=token.getToken().getClaimAsString("deliveryPartnerId");
    return id!=null && !id.isBlank()?id:null;
  }
  public boolean assignedOrder(UUID id) {
    String partner=partnerId();
    return partner!=null && shipments.findByOrderId(id).map(s -> partner.equals(s.getDeliveryPartnerId())).orElse(false);
  }
  public boolean assignedShipment(UUID id) {
    String partner=partnerId();
    return partner!=null && shipments.findById(id).map(s -> partner.equals(s.getDeliveryPartnerId())).orElse(false);
  }
  public boolean owner(UUID id) {return admin() || fulfillments.findById(id).map(f -> PublicApiSecurity.owns(f.getCustomerId()) || PublicApiSecurity.managesStore(f.getStoreId())).orElse(false);}
  public boolean order(UUID id) {return admin() || assignedOrder(id) || fulfillments.findByOrderId(id).map(f -> PublicApiSecurity.owns(f.getCustomerId()) || PublicApiSecurity.managesStore(f.getStoreId())).orElseGet(() -> snapshots.findById(id).map(f -> PublicApiSecurity.owns(f.getCustomerId()) || PublicApiSecurity.managesStore(f.getStoreId())).orElse(false));}
  public boolean shipment(UUID id) {return admin() || assignedShipment(id) || shipments.findById(id).map(s -> PublicApiSecurity.owns(s.getFulfillment().getCustomerId()) || PublicApiSecurity.managesStore(s.getFulfillment().getStoreId())).orElse(false);}
  public boolean manage(UUID id) {return admin() || fulfillments.findById(id).map(f -> PublicApiSecurity.managesStore(f.getStoreId())).orElse(false);}
  public boolean manageShipment(UUID id) {return admin() || shipments.findById(id).map(s -> PublicApiSecurity.managesStore(s.getFulfillment().getStoreId())).orElse(false);}
  public boolean updateAssignedShipment(UUID id) {return manageShipment(id) || assignedShipment(id);}
  public boolean create(CreateFulfillmentRequest request) {
    return admin() || snapshots.findById(request.orderId()).map(s -> !s.isCancelled()
        && PublicApiSecurity.managesStore(s.getStoreId()) && s.getStoreId().equals(request.storeId())
        && s.getCustomerId().equals(request.customerId())
        && java.util.Objects.equals(s.getShippingAddressId(), request.shippingAddressId())
        && s.getFulfillmentType() == request.fulfillmentType()).orElse(false);
  }
}
