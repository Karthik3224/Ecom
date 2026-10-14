package com.metaarch.catalog.banner;

import java.net.URI;
import java.util.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/banners")
public class BannerController {
  private final BannerService service;
  public BannerController(BannerService service) { this.service = service; }

  @GetMapping
  List<BannerResponse> list(@RequestParam(name = "all", defaultValue = "false") boolean all) {
    return service.list(!all);
  }

  @GetMapping("/{id}")
  BannerResponse get(@PathVariable UUID id) { return service.get(id); }

  @PostMapping
  ResponseEntity<BannerResponse> create(@Valid @RequestBody BannerRequest r) {
    BannerResponse v = service.create(r);
    return ResponseEntity.created(URI.create("/api/v1/banners/" + v.id())).body(v);
  }

  @PutMapping("/{id}")
  BannerResponse update(@PathVariable UUID id, @Valid @RequestBody BannerRequest r) { return service.update(id, r); }

  @PatchMapping("/{id}/status")
  BannerResponse setStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
    String raw = body == null ? null : body.get("status");
    return service.setStatus(id, raw == null ? null : BannerStatus.valueOf(raw.trim().toUpperCase()));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@PathVariable UUID id) { service.delete(id); }
}
