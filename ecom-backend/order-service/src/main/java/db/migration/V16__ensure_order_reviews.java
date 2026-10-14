package db.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V16__ensure_order_reviews extends BaseJavaMigration {
  @Override
  public void migrate(Context context) throws Exception {
    try (Statement statement = context.getConnection().createStatement()) {
      statement.execute("CREATE TABLE IF NOT EXISTS order_reviews ("
          + "id BINARY(16) NOT NULL PRIMARY KEY,"
          + "order_id BINARY(16) NOT NULL UNIQUE,"
          + "customer_id BINARY(16) NOT NULL,"
          + "rating TINYINT NOT NULL,"
          + "comment VARCHAR(1000) NOT NULL,"
          + "photo_urls JSON NOT NULL,"
          + "created_at DATETIME(6) NOT NULL,"
          + "updated_at DATETIME(6) NOT NULL,"
          + "CONSTRAINT chk_order_reviews_rating CHECK (rating BETWEEN 1 AND 5),"
          + "CONSTRAINT fk_order_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id)"
          + ")");
    }
  }
}
