package db.migration;

import java.sql.*;
import org.flywaydb.core.api.migration.Context;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

class HandlingFeeMigrationTest {
  Context context = mock(Context.class);
  Connection connection = mock(Connection.class);
  DatabaseMetaData metadata = mock(DatabaseMetaData.class);
  ResultSet columns = mock(ResultSet.class);
  V10__add_order_handling_fee migration = new V10__add_order_handling_fee();

  @BeforeEach void setup() throws Exception {
    when(context.getConnection()).thenReturn(connection);
    when(connection.getMetaData()).thenReturn(metadata);
    when(metadata.getDatabaseProductName()).thenReturn("MySQL");
    when(metadata.getDatabaseMajorVersion()).thenReturn(8);
    when(connection.getCatalog()).thenReturn("orders-test");
    when(metadata.getColumns("orders-test", null, "orders", "handling_fee")).thenReturn(columns);
  }
  void existing(int precision) throws Exception {
    when(columns.next()).thenReturn(true, false);
    when(columns.getString("COLUMN_NAME")).thenReturn("handling_fee");
    when(columns.getString("COLUMN_DEF")).thenReturn("0.00");
    when(columns.getInt("DATA_TYPE")).thenReturn(Types.DECIMAL);
    when(columns.getInt("COLUMN_SIZE")).thenReturn(precision);
    when(columns.getInt("DECIMAL_DIGITS")).thenReturn(2);
    when(columns.getInt("NULLABLE")).thenReturn(DatabaseMetaData.columnNoNulls);
  }
  @Test void compatibleExistingColumnDoesNotExecuteDdlOrChangeTotals() throws Exception {
    existing(10);
    migration.migrate(context);
    verify(connection, never()).createStatement();
  }
  @Test void missingColumnIsAddedOnlyOnce() throws Exception {
    when(columns.next()).thenReturn(false);
    Statement statement = mock(Statement.class);
    when(connection.createStatement()).thenReturn(statement);
    migration.migrate(context);
    verify(statement).execute("ALTER TABLE orders ADD COLUMN handling_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00");
  }
  @Test void incompatibleColumnFailsWithoutDdl() throws Exception {
    existing(12);
    assertThatThrownBy(() -> migration.migrate(context)).isInstanceOf(SQLException.class);
    verify(connection, never()).createStatement();
  }
  @Test void unsupportedDatabaseFailsWithoutDdl() throws Exception {
    when(metadata.getDatabaseProductName()).thenReturn("H2");
    assertThatThrownBy(() -> migration.migrate(context)).isInstanceOf(SQLException.class);
    verify(connection, never()).createStatement();
  }
}
