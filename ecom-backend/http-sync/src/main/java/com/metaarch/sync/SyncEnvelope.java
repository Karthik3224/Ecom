package com.metaarch.sync;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;

public record SyncEnvelope(UUID eventId, String source, String kind, String aggregateId, JsonNode payload) {}
