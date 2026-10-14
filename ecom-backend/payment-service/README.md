# Payment Service

Spring Boot service on port 3314. Core synchronization uses authenticated HTTP
and transactional database outboxes, not Kafka.

No provider is configured. `GET /api/v1/payments/capabilities` returns
`processingEnabled: false`. Initiation and demo settlement/refund APIs reject
requests without creating successful charges or refunds. Order events can create
local pending records; these are not provider transactions.

`PaymentProvider` defines initiation, status verification, refund idempotency and
raw-body webhook signature verification. The default implementation fails closed.
An approved adapter and durable initiation/reconciliation workflow are required
before capabilities can enable processing.

`POST /internal/provider/payment-webhook` verifies the signature and independently
queries remote status before its local transaction. It requires a persisted
provider binding and matching order, amount and INR currency. Provider receipts
deduplicate callbacks; payment state, transaction evidence, receipt and outgoing
event commit together. Binding creation and real refunds remain unimplemented.

`POST /internal/events` verifies source-specific HMAC signatures and timestamps.
Inbox identity and domain updates commit together. Pending outbox records survive
worker restarts; HTTP delivery occurs outside the transaction. Only HTTP 204
acknowledges delivery. Exhausted records remain for operator review.

V3 synchronization and V4 provider binding/receipt migrations are prepared but
NOT applied. Do not enable live migrations without approval and history review.
See `KAFKA-MIGRATION-STATUS.md` and `.env.http-sync.example` for setup/limitations.
