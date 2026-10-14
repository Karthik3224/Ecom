package com.metaarch.fulfillment.shipment;

import java.time.*;
import java.util.UUID;

public record ShipmentResponse(UUID id, UUID fulfillmentId, UUID orderId, String carrier, String trackingNumber, String deliveryPartnerId, String deliveryPartnerName, String deliveryPartnerPhone, String deliveryPartnerVehicleNumber, Instant deliveryAssignedAt, ShipmentStatus status, Instant shippedAt, Instant deliveredAt, LocalDate estimatedDeliveryDate, Instant createdAt, Instant updatedAt) {
  public static ShipmentResponse from(Shipment shipment) {
    return new ShipmentResponse(shipment.getId(), shipment.getFulfillmentId(), shipment.getOrderId(), shipment.getCarrier(), shipment.getTrackingNumber(), shipment.getDeliveryPartnerId(), shipment.getDeliveryPartnerName(), shipment.getDeliveryPartnerPhone(), shipment.getDeliveryPartnerVehicleNumber(), shipment.getDeliveryAssignedAt(), shipment.getStatus(), shipment.getShippedAt(), shipment.getDeliveredAt(), shipment.getEstimatedDeliveryDate(), shipment.getCreatedAt(), shipment.getUpdatedAt());
  }
}
