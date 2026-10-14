package com.metaarch.inventory.reservation;

import com.metaarch.sync.PublicApiSecurity;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import(PublicApiSecurity.class)
public class InventorySecurity { }
