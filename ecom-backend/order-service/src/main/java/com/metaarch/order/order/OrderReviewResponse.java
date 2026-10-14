package com.metaarch.order.order;

import java.time.Instant;
import java.util.*;

public record OrderReviewResponse(UUID id, UUID orderId, UUID customerId, int rating, String comment, List<String> photoUrls, Instant createdAt, Instant updatedAt) { }
