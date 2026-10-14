package com.metaarch.order.order;

import java.util.*;
import jakarta.validation.constraints.*;

public record OrderReviewRequest(
  @Min(1) @Max(5) int rating,
  @Size(max = 1000) String comment,
  @Size(max = 3) List<@Size(max = 180000) String> photoUrls
) { }
