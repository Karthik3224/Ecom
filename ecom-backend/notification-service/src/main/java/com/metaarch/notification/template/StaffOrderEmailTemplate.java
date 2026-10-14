package com.metaarch.notification.template;

import com.metaarch.notification.event.OrderEvent;

public final class StaffOrderEmailTemplate {
  private StaffOrderEmailTemplate() { }

  public static String subject(OrderEvent event) {
    return "New Order Received - " + String.valueOf(event.orderId());
  }

  public static String body(OrderEvent event) {
    return "A new order has been created.\n\n"
      + "Order ID: " + value(event.orderId()) + "\n"
      + "Order Number: " + value(event.orderNumber()) + "\n"
      + "Store: " + value(event.storeId()) + "\n"
      + "Delivery Zone ID: " + value(event.deliveryZoneId()) + "\n"
      + "Location: " + value(event.locationId()) + "\n"
      + "Total Amount: " + value(event.totalAmount()) + "\n"
      + "Created At: " + value(event.occurredAt()) + "\n";
  }

  private static String value(Object value) { return value == null ? "Not available" : value.toString(); }
}
