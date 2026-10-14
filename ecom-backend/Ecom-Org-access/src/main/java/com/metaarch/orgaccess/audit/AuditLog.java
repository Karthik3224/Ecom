package com.metaarch.orgaccess.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable = false, length = 190)
  private String actor;
  @Column(nullable = false, length = 80)
  private String action;
  @Column(nullable = false, length = 255)
  private String target;
  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected AuditLog() {}
  public AuditLog(String actor, String action, String target) {
    this.actor = actor; this.action = action; this.target = target;
  }
}
