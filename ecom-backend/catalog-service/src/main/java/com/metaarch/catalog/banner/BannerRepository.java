package com.metaarch.catalog.banner;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface BannerRepository extends JpaRepository<Banner, UUID> {
  List<Banner> findAllByOrderBySortOrderAscCreatedAtAsc();
  List<Banner> findByStatusOrderBySortOrderAscCreatedAtAsc(BannerStatus status);
}
