package com.metaarch.catalog.category;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface CategoryRepository extends JpaRepository<Category,UUID> { boolean existsBySlugIgnoreCase(String slug); boolean existsBySlugIgnoreCaseAndIdNot(String slug,UUID id); }
