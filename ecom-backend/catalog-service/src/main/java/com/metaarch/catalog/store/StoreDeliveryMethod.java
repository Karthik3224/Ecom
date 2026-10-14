package com.metaarch.catalog.store;

import com.metaarch.catalog.common.AuditedEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "store_delivery_methods")
public class StoreDeliveryMethod extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(name = "store_id", nullable = false, length = 100) private String storeId;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "delivery_zone_id") private StoreDeliveryZone zone;
  @Column(name = "delivery_type", nullable = false, length = 60) private String deliveryType;
  @Column(nullable = false) private boolean enabled = true;
  @Column(name = "delivery_charge", precision = 10, scale = 2) private BigDecimal deliveryCharge;
  @Column(name = "estimated_time", length = 80) private String estimatedTime;
  @Column(name = "cutoff_time", length = 20) private String cutoffTime;
  @Column(name = "settings_configuration", columnDefinition = "TEXT") private String settingsConfiguration;
  public Long getId(){return id;} public String getStoreId(){return storeId;} public void setStoreId(String v){storeId=v;}
  public StoreDeliveryZone getZone(){return zone;} public void setZone(StoreDeliveryZone v){zone=v;}
  public String getDeliveryType(){return deliveryType;} public void setDeliveryType(String v){deliveryType=v;}
  public boolean isEnabled(){return enabled;} public void setEnabled(boolean v){enabled=v;}
  public BigDecimal getDeliveryCharge(){return deliveryCharge;} public void setDeliveryCharge(BigDecimal v){deliveryCharge=v;}
  public String getEstimatedTime(){return estimatedTime;} public void setEstimatedTime(String v){estimatedTime=v;}
  public String getCutoffTime(){return cutoffTime;} public void setCutoffTime(String v){cutoffTime=v;}
  public String getSettingsConfiguration(){return settingsConfiguration;} public void setSettingsConfiguration(String v){settingsConfiguration=v;}
}
