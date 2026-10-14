package com.metaarch.notification.template;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class TemplateRenderer {
  public String render(String template, Map<String, ?> values) {
    String rendered = template;
    for (Map.Entry<String, ?> entry : values.entrySet()) {
      String value = entry.getValue() == null ? "" : entry.getValue().toString();
      rendered = rendered.replace("{{" + entry.getKey() + "}}", value);
    }
    return rendered;
  }
}
