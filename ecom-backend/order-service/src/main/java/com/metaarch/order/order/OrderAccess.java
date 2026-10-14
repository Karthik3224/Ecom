package com.metaarch.order.order;

import com.metaarch.sync.PublicApiSecurity;
import java.util.UUID;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component("orderAccess")
@Import(PublicApiSecurity.class)
public class OrderAccess {
  private final OrderRepository orders;
  public OrderAccess(OrderRepository orders) { this.orders = orders; }
  public boolean admin() { return PublicApiSecurity.administrator(); }
  public boolean customer(UUID id) { return admin() || PublicApiSecurity.owns(id); }
  @org.springframework.beans.factory.annotation.Value("${FULFILLMENT_SERVICE_URL:http://127.0.0.1:3315}")
  private String fulfillmentUrl="http://127.0.0.1:3315";
  private boolean assignedPartner(UUID id) {
    var auth=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    if (!(auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken token)
        || "customer".equals(token.getToken().getClaimAsString("accountType"))
        || token.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DELIVERY_PARTNER"))) return false;
    String partner=token.getToken().getClaimAsString("deliveryPartnerId");
    if (partner==null || partner.isBlank()) return false;
    var factory=new org.springframework.http.client.SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(3000); factory.setReadTimeout(5000);
    try {
      var shipment=org.springframework.web.client.RestClient.builder().requestFactory(factory).baseUrl(fulfillmentUrl).build().get()
        .uri("/api/v1/shipments/order/"+id).header("Authorization","Bearer "+token.getToken().getTokenValue()).retrieve().body(java.util.Map.class);
      return shipment!=null && id.toString().equals(String.valueOf(shipment.get("orderId"))) && partner.equals(String.valueOf(shipment.get("deliveryPartnerId")));
    } catch (org.springframework.web.client.RestClientException error) { return false; }
  }
  public boolean read(UUID id) { return owner(id) || assignedPartner(id); }
  public boolean owner(UUID id) { return admin() || orders.findById(id).map(o -> PublicApiSecurity.owns(o.getCustomerId()) || PublicApiSecurity.managesStore(o.getStoreId())).orElse(false); }
  public boolean store(String storeId) { return admin() || PublicApiSecurity.managesStore(storeId); }
  public boolean manage(UUID id) { return admin() || orders.findById(id).map(o -> PublicApiSecurity.managesStore(o.getStoreId())).orElse(false); }
  public boolean create(UUID id) { return PublicApiSecurity.owns(id); }
}
