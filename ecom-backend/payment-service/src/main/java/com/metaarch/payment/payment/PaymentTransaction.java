package com.metaarch.payment.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "payment_id", nullable = false) private Payment payment;
  @Column(name = "transaction_reference", nullable = false, unique = true, length = 60) private String transactionReference;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "transaction_type", nullable = false, length = 30) private TransactionType transactionType;
  @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30) private TransactionStatus status;
  @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

  protected PaymentTransaction() { }

  public PaymentTransaction(String transactionReference, TransactionType transactionType, BigDecimal amount, TransactionStatus status) {
    this.transactionReference = transactionReference;
    this.transactionType = transactionType;
    this.amount = amount;
    this.status = status;
  }

  public UUID getId() { return id; }
  public Payment getPayment() { return payment; }
  public void setPayment(Payment payment) { this.payment = payment; }
  public String getTransactionReference() { return transactionReference; }
  public TransactionType getTransactionType() { return transactionType; }
  public BigDecimal getAmount() { return amount; }
  public TransactionStatus getStatus() { return status; }
  public Instant getCreatedAt() { return createdAt; }
}
