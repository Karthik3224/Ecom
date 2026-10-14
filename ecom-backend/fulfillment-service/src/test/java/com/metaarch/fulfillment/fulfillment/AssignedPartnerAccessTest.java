package com.metaarch.fulfillment.fulfillment;
import com.metaarch.fulfillment.shipment.*;
import com.metaarch.fulfillment.event.FulfillmentOrderSnapshotRepository;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class AssignedPartnerAccessTest {
  @AfterEach void clear() { SecurityContextHolder.clearContext(); }
  @Test void partnerReadsOnlySavedAssignmentsAndCannotManageThem() {
    var shipments=mock(ShipmentRepository.class);
    var saved=mock(Shipment.class);
    var fulfillment=mock(Fulfillment.class);
    when(saved.getFulfillment()).thenReturn(fulfillment);
    when(fulfillment.getStoreId()).thenReturn("store-a");
    var orderId=UUID.randomUUID(); var shipmentId=UUID.randomUUID();
    when(saved.getDeliveryPartnerId()).thenReturn("42");
    when(shipments.findByOrderId(orderId)).thenReturn(Optional.of(saved));
    when(shipments.findById(shipmentId)).thenReturn(Optional.of(saved));
    var access=new FulfillmentAccess(mock(FulfillmentRepository.class),shipments,mock(FulfillmentOrderSnapshotRepository.class));
    var jwt=Jwt.withTokenValue("verified").header("alg","HS512").subject("partner").claim("deliveryPartnerId","42").build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_DELIVERY_PARTNER"))));
    assertTrue(access.assignedOrder(orderId)); assertTrue(access.assignedShipment(shipmentId));
    assertFalse(access.manageShipment(shipmentId));
    when(saved.getDeliveryPartnerId()).thenReturn("43");
    assertFalse(access.assignedOrder(orderId)); assertFalse(access.assignedShipment(shipmentId));
    SecurityContextHolder.clearContext(); assertNull(access.partnerId());
  }
  @Test void customerCannotImpersonatePartnerWithClaimOrRole() {
    var access=new FulfillmentAccess(mock(FulfillmentRepository.class),mock(ShipmentRepository.class),mock(FulfillmentOrderSnapshotRepository.class));
    var jwt=Jwt.withTokenValue("verified").header("alg","HS512").subject("customer").claim("accountType","customer").claim("deliveryPartnerId","42").build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_DELIVERY_PARTNER"))));
    assertNull(access.partnerId()); assertFalse(access.assignedOrder(UUID.randomUUID()));
  }
}
