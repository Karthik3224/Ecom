package com.metaarch.catalog.banner;

import java.util.*;
import com.metaarch.catalog.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BannerService {
  private final BannerRepository banners;
  public BannerService(BannerRepository banners) { this.banners = banners; }

  @Transactional(readOnly = true)
  public List<BannerResponse> list(boolean activeOnly) {
    List<Banner> rows = activeOnly
        ? banners.findByStatusOrderBySortOrderAscCreatedAtAsc(BannerStatus.ACTIVE)
        : banners.findAllByOrderBySortOrderAscCreatedAtAsc();
    return rows.stream().map(BannerResponse::from).toList();
  }

  @Transactional(readOnly = true)
  public BannerResponse get(UUID id) { return BannerResponse.from(find(id)); }

  @Transactional
  public BannerResponse create(BannerRequest r) {
    Banner b = new Banner(r.title().trim(), r.imageUrl().trim());
    apply(b, r);
    return BannerResponse.from(banners.save(b));
  }

  @Transactional
  public BannerResponse update(UUID id, BannerRequest r) {
    Banner b = find(id);
    b.setTitle(r.title().trim());
    b.setImageUrl(r.imageUrl().trim());
    apply(b, r);
    return BannerResponse.from(b);
  }

  @Transactional
  public BannerResponse setStatus(UUID id, BannerStatus status) {
    Banner b = find(id);
    b.setStatus(status == null ? BannerStatus.ACTIVE : status);
    return BannerResponse.from(b);
  }

  @Transactional
  public void delete(UUID id) { banners.delete(find(id)); }

  private Banner find(UUID id) {
    return banners.findById(id).orElseThrow(() -> new ResourceNotFoundException("Banner not found: " + id));
  }

  private void apply(Banner b, BannerRequest r) {
    b.setDescription(blank(r.description()));
    b.setMobileImageUrl(blank(r.mobileImageUrl()));
    b.setTargetUrl(blank(r.targetUrl()));
    b.setScope(r.scopeOrDefault());
    b.setLocationId(r.scopeOrDefault() == BannerScope.LOCATION || r.scopeOrDefault() == BannerScope.STORE ? blank(r.locationId()) : null);
    b.setStoreId(r.scopeOrDefault() == BannerScope.STORE ? blank(r.storeId()) : null);
    b.setSortOrder(r.sortOrderOrZero());
    b.setStatus(r.statusOrDefault());
    b.setStartsOn(r.startsOn());
    b.setEndsOn(r.endsOn());
  }

  private String blank(String v) { return v == null || v.isBlank() ? null : v.trim(); }
}
