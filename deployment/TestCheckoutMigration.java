import java.sql.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.flywaydb.core.Flyway;

public class TestCheckoutMigration {
  public static void main(String[] args) throws Exception {
    if(args.length!=2 || !args[0].matches("multistore_(order|inventory)_[a-f0-9]{8}")) throw new IllegalArgumentException("Restored test database required");
    String url="jdbc:mysql://127.0.0.1:14306/"+args[0]+"?useSSL=false&allowPublicKeyRetrieval=true";
    try(var connection=DriverManager.getConnection(url,"root","")) {
      try(var result=connection.createStatement().executeQuery("SELECT @@server_uuid")) {
        result.next();
        if(!"580d1315-c4bf-11f1-bf4b-14cb19888cfa".equals(result.getString(1))) throw new IllegalStateException("Wrong isolated server");
      }
      String sql=args[1].equals("order")?"SELECT HEX(id),total_amount,payment_status FROM orders ORDER BY id":"SELECT HEX(id),available_quantity,reserved_quantity FROM inventories ORDER BY id";
      String before=digest(connection,sql);
      Flyway flyway=Flyway.configure().dataSource(url,"root","").locations("classpath:db/migration").ignoreMigrationPatterns("*:pending").load();
      var pending=new java.util.HashSet<String>();
      for(var migration:flyway.info().pending()) pending.add(migration.getVersion().toString());
      var expected=args[1].equals("order")?java.util.Set.of("13","14"):java.util.Set.of("6","7");
      if(!pending.equals(expected)) throw new IllegalStateException("Unexpected pending migrations: "+pending);
      flyway.validate();
      int applied=flyway.migrate().migrationsExecuted;
      flyway.validate();
      if(!before.equals(digest(connection,sql))) throw new IllegalStateException("Existing data changed");
      if(flyway.migrate().migrationsExecuted!=0) throw new IllegalStateException("Repeat was not a no-op");
      System.out.println("PASS restored "+args[1]+" migration; applied="+applied+"; existing-data-preserved; repeat=0");
    }
  }
  private static String digest(Connection connection,String sql) throws Exception {
    var hash=MessageDigest.getInstance("SHA-256");
    try(var result=connection.createStatement().executeQuery(sql)) {
      while(result.next()) for(int i=1;i<=result.getMetaData().getColumnCount();i++) {
        hash.update(String.valueOf(result.getObject(i)).getBytes(StandardCharsets.UTF_8));hash.update((byte)0);
      }
    }
    return HexFormat.of().formatHex(hash.digest());
  }
}
