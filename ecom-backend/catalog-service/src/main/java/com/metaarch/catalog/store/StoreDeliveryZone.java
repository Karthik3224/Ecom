package com.metaarch.catalog.store;

import com.metaarch.catalog.common.AuditedEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "store_delivery_zones")
public class StoreDeliveryZone extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(name = "store_id", nullable = false, length = 100) private String storeId;
  @Column(name = "location_id", length = 100) private String locationId;
  @Column(name = "min_radius_km", nullable = false, precision = 8, scale = 2) private BigDecimal minRadiusKm = BigDecimal.ZERO;
  @Column(name = "max_radius_km", nullable = false, precision = 8, scale = 2) private BigDecimal maxRadiusKm;
  @Column(name = "estimated_delivery_min") private Integer estimatedDeliveryMin;
  @Column(name = "estimated_delivery_max") private Integer estimatedDeliveryMax;
  @Column(name = "delivery_charge", nullable = false, precision = 10, scale = 2) private BigDecimal deliveryCharge = BigDecimal.ZERO;
  @Column(name = "free_delivery_above", precision = 10, scale = 2) private BigDecimal freeDeliveryAbove;
  @Column(name = "minimum_order", precision = 10, scale = 2) private BigDecimal minimumOrder;
  @Column(nullable = false, length = 40) private String status = "Active";
  public Long getId(){return id;} public String getStoreId(){return storeId;} public void setStoreId(String v){storeId=v;}
  public String getLocationId(){return locationId;} public void setLocationId(String v){locationId=v;}
  public BigDecimal getMinRadiusKm(){return minRadiusKm;} public void setMinRadiusKm(BigDecimal v){minRadiusKm=v;}
  public BigDecimal getMaxRadiusKm(){return maxRadiusKm;} public void setMaxRadiusKm(BigDecimal v){maxRadiusKm=v;}
  public Integer getEstimatedDeliveryMin(){return estimatedDeliveryMin;} public void setEstimatedDeliveryMin(Integer v){estimatedDeliveryMin=v;}
  public Integer getEstimatedDeliveryMax(){return estimatedDeliveryMax;} public void setEstimatedDeliveryMax(Integer v){estimatedDeliveryMax=v;}
  public BigDecimal getDeliveryCharge(){return deliveryCharge;} public void setDeliveryCharge(BigDecimal v){deliveryCharge=v;}
  public BigDecimal getFreeDeliveryAbove(){return freeDeliveryAbove;} public void setFreeDeliveryAbove(BigDecimal v){freeDeliveryAbove=v;}
  public BigDecimal getMinimumOrder(){return minimumOrder;} public void setMinimumOrder(BigDecimal v){minimumOrder=v;}
  public String getStatus(){return status;} public void setStatus(String v){status=v;}
}
