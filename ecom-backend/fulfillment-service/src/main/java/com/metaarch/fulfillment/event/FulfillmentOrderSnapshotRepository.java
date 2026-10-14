package com.metaarch.fulfillment.event;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FulfillmentOrderSnapshotRepository extends JpaRepository<FulfillmentOrderSnapshot, UUID> { }
