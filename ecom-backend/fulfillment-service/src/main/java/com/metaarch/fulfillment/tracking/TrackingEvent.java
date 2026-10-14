package com.metaarch.fulfillment.tracking;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.fulfillment.common.CreatedEntity;
import com.metaarch.fulfillment.shipment.*;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tracking_events")
public class TrackingEvent extends CreatedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "shipment_id", nullable = false) private Shipment shipment;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30) private ShipmentStatus status;
  @Column(nullable = false, length = 160) private String location;
  @Column(nullable = false, length = 500) private String description;
  @Column(name = "event_time", nullable = false) private Instant eventTime;

  protected TrackingEvent() { }

  public TrackingEvent(Shipment shipment, ShipmentStatus status, String location, String description, Instant eventTime) {
    this.shipment = shipment;
    this.status = status;
    this.location = location;
    this.description = description;
    this.eventTime = eventTime;
  }

  public UUID getId() { return id; }
  public UUID getShipmentId() { return shipment == null ? null : shipment.getId(); }
  public ShipmentStatus getStatus() { return status; }
  public String getLocation() { return location; }
  public String getDescription() { return description; }
  public Instant getEventTime() { return eventTime; }
}
