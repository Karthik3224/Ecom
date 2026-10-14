package com.metaarch.sync;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("sync")
public class SyncProperties {
  private String service;
  private Map<String, String> keys = new LinkedHashMap<>();
  private Map<String, String> targets = new LinkedHashMap<>();
  private Map<String, String> routes = new LinkedHashMap<>();
  private int maxAttempts = 20;
  public String getService() { return service; }
  public void setService(String value) { service = value; }
  public Map<String, String> getKeys() { return keys; }
  public void setKeys(Map<String, String> value) { keys = value; }
  public Map<String, String> getTargets() { return targets; }
  public void setTargets(Map<String, String> value) { targets = value; }
  public Map<String, String> getRoutes() { return routes; }
  public void setRoutes(Map<String, String> value) { routes = value; }
  public int getMaxAttempts() { return maxAttempts; }
  public void setMaxAttempts(int value) { maxAttempts = value; }
}
