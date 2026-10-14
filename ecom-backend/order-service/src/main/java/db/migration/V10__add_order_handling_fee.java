package db.migration;

import java.math.BigDecimal;
import java.sql.*;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** MySQL-specific reconciliation of an unrecorded, possibly pre-existing column. */
public class V10__add_order_handling_fee extends BaseJavaMigration {
  @Override public Integer getChecksum() { return 1001; }
  @Override public boolean canExecuteInTransaction() { return false; }

  @Override public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    DatabaseMetaData metadata = connection.getMetaData();
    if (!"MySQL".equals(metadata.getDatabaseProductName()) || metadata.getDatabaseMajorVersion() != 8) {
      throw new SQLException("V10 supports reviewed MySQL 8 only; no schema changed");
    }
    try (ResultSet columns = metadata.getColumns(connection.getCatalog(), null, "orders", "handling_fee")) {
      while (columns.next()) {
        if (!"handling_fee".equals(columns.getString("COLUMN_NAME"))) continue;
        String defaultValue = columns.getString("COLUMN_DEF");
        boolean compatible = columns.getInt("DATA_TYPE") == Types.DECIMAL
            && columns.getInt("COLUMN_SIZE") == 10 && columns.getInt("DECIMAL_DIGITS") == 2
            && columns.getInt("NULLABLE") == DatabaseMetaData.columnNoNulls
            && defaultValue != null && new BigDecimal(defaultValue).compareTo(BigDecimal.ZERO) == 0;
        if (!compatible) throw new SQLException("Existing handling_fee is incompatible; manual review required, no schema changed");
        return;
      }
    }
    try (Statement statement = connection.createStatement()) {
      statement.execute("ALTER TABLE orders ADD COLUMN handling_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    }
  }
}
