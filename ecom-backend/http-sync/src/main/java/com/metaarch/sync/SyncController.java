package com.metaarch.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
public class SyncController {
  private final DurableEvents events;
  private final SyncAuthentication authentication;
  private final ObjectMapper mapper;
  public SyncController(DurableEvents events, SyncAuthentication authentication, ObjectMapper mapper) {
    this.events = events; this.authentication = authentication; this.mapper = mapper;
  }
  @ExceptionHandler(ResponseStatusException.class)
  public org.springframework.http.ResponseEntity<Void> status(ResponseStatusException ex) {
    return org.springframework.http.ResponseEntity.status(ex.getStatusCode()).build();
  }
  @PostMapping(value = "/internal/events", consumes = "application/json")
  @ResponseStatus(NO_CONTENT)
  public void receive(@RequestBody byte[] body,
                      @RequestHeader(value="X-Sync-Source", defaultValue="") String source,
                      @RequestHeader(value="X-Sync-Time", defaultValue="") String timestamp,
                      @RequestHeader(value="X-Sync-Signature", defaultValue="") String signature) {
    if (body.length > 262144) throw new ResponseStatusException(PAYLOAD_TOO_LARGE);
    if (!authentication.verify(source, timestamp, signature, body)) throw new ResponseStatusException(UNAUTHORIZED);
    try {
      SyncEnvelope event = mapper.readValue(body, SyncEnvelope.class);
      if (!source.equals(event.source())) throw new ResponseStatusException(FORBIDDEN);
      events.receive(event, body);
    } catch (java.io.IOException ex) { throw new ResponseStatusException(BAD_REQUEST); }
  }
}
