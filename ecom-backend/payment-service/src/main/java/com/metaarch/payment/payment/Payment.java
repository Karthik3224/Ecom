package com.metaarch.payment.payment;

import java.math.BigDecimal;
import java.util.*;
import com.metaarch.payment.common.AuditedEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "payments")
public class Payment extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(name = "order_id", nullable = false, unique = true) private UUID orderId;
  @Column(name = "customer_id", nullable = false) private UUID customerId;
  @Column(name = "payment_reference", nullable = false, unique = true, length = 50) private String paymentReference;
  @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
  @Column(nullable = false, length = 3) private String currency;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "payment_method", nullable = false, length = 30) private PaymentMethod paymentMethod;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30) private PaymentStatus status;
  @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true) private List<PaymentTransaction> transactions = new ArrayList<>();

  protected Payment() { }

  public Payment(UUID orderId, UUID customerId, String paymentReference, BigDecimal amount, String currency, PaymentMethod paymentMethod) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.paymentReference = paymentReference;
    this.amount = amount;
    this.currency = currency;
    this.paymentMethod = paymentMethod;
    this.status = PaymentStatus.PENDING;
  }

  public UUID getId() { return id; }
  public UUID getOrderId() { return orderId; }
  public UUID getCustomerId() { return customerId; }
  public String getPaymentReference() { return paymentReference; }
  public BigDecimal getAmount() { return amount; }
  public String getCurrency() { return currency; }
  public PaymentMethod getPaymentMethod() { return paymentMethod; }
  public PaymentStatus getStatus() { return status; }
  public void setStatus(PaymentStatus status) { this.status = status; }
  public List<PaymentTransaction> getTransactions() { return transactions; }
  public void addTransaction(PaymentTransaction transaction) { transaction.setPayment(this); transactions.add(transaction); }
}
