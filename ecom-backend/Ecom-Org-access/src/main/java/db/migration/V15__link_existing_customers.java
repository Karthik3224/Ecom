package db.migration;

import java.sql.*;
import java.util.UUID;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Copies identity links only. Profile/address/business data stays in its owning service.
 * The legacy datasource must be explicitly configured: fail closed rather than assign
 * new UUIDs to customers whose orders already reference an existing profile UUID. */
public class V15__link_existing_customers extends BaseJavaMigration {
  @Override public void migrate(Context context) throws Exception {
    if (Boolean.parseBoolean(System.getenv().getOrDefault("CUSTOMER_MIGRATION_SKIP", "false"))) {
      return;
    }
    String url = System.getenv("CUSTOMER_MIGRATION_JDBC_URL");
    if (url == null || url.isBlank()) throw new IllegalStateException(
        "Set CUSTOMER_MIGRATION_JDBC_URL to the existing customer_profiles database before migrating.");
    Connection target = context.getConnection();
    try (Connection source = DriverManager.getConnection(url,
        System.getenv().getOrDefault("CUSTOMER_MIGRATION_DB_USER", "root"),
        System.getenv().getOrDefault("CUSTOMER_MIGRATION_DB_PASSWORD", ""));
        Statement statement = source.createStatement();
        ResultSet profiles = statement.executeQuery("SELECT id,username,name,phone,email,created_at,updated_at FROM customer_profiles")) {
      while (profiles.next()) {
        long userId;
        try (PreparedStatement find = target.prepareStatement("SELECT id FROM users WHERE username=?")) {
          find.setString(1, profiles.getString("username"));
          try (ResultSet user = find.executeQuery()) {
            if (!user.next()) {
              // Retain orphan profile identities without inventing a usable password.
              try (PreparedStatement insert = target.prepareStatement(
                  "INSERT INTO users(username,email,mobile,enabled,locked,status,email_verified) VALUES(?,?,?,FALSE,FALSE,'Pending',FALSE)", Statement.RETURN_GENERATED_KEYS)) {
                insert.setString(1, profiles.getString("username"));
                String email = profiles.getString("email");
                insert.setString(2, email == null || email.isBlank() ? UUID.randomUUID()+"@unclaimed.invalid" : email);
                insert.setString(3, profiles.getString("phone")); insert.executeUpdate();
                try (ResultSet keys = insert.getGeneratedKeys()) { keys.next(); userId=keys.getLong(1); }
              }
              try (PreparedStatement role = target.prepareStatement("INSERT INTO user_roles(user_id,role_id) SELECT ?,id FROM roles WHERE name='CUSTOMER'")) {
                role.setLong(1,userId); role.executeUpdate();
              }
            } else userId=user.getLong(1);
          }
        }
        try (PreparedStatement insert = target.prepareStatement(
            "INSERT INTO customers(id,user_id,full_name,created_at,updated_at) VALUES(?,?,?,?,?)")) {
          insert.setBytes(1,profiles.getBytes("id")); insert.setLong(2,userId);
          insert.setString(3,profiles.getString("name"));
          insert.setTimestamp(4,profiles.getTimestamp("created_at")); insert.setTimestamp(5,profiles.getTimestamp("updated_at"));
          insert.executeUpdate();
        }
      }
    }
    try (Statement statement = target.createStatement()) {
      statement.executeUpdate("INSERT INTO customers(id,user_id,full_name) SELECT UNHEX(REPLACE(UUID(),'-','')),u.id,LEFT(COALESCE(NULLIF(u.display_name,''),u.username),120) FROM users u WHERE EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.name='CUSTOMER') AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.user_id=u.id)");
      statement.executeUpdate("INSERT IGNORE INTO customer_contact_claims(contact,user_id) SELECT CONCAT('email:',LOWER(TRIM(email))),id FROM users");
      statement.executeUpdate("INSERT IGNORE INTO customer_contact_claims(contact,user_id) SELECT CONCAT('mobile:',REGEXP_REPLACE(mobile,'[^0-9]','')),id FROM users WHERE mobile IS NOT NULL AND TRIM(mobile)<>''");
    }
  }
}
