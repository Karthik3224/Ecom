import java.sql.*;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Synthetic test account only; never accepts a live database endpoint. */
public class IsolatedLoginFixture {
  public static void main(String[] args) throws Exception {
    try(var connection=DriverManager.getConnection("jdbc:mysql://127.0.0.1:14306/users_roles?sslMode=DISABLED&allowPublicKeyRetrieval=true","root","")) {
      try(var query=connection.createStatement();var rows=query.executeQuery("SELECT @@server_uuid,@@port")) {
        rows.next();if(!rows.getString(1).equals("580d1315-c4bf-11f1-bf4b-14cb19888cfa") || rows.getInt(2)!=14306)throw new IllegalStateException("Wrong isolated fixture target");
      }
      String id=UUID.randomUUID().toString(),username="isolated-qa-"+id,email=username+"@example.test";
      try(var insert=connection.prepareStatement("INSERT INTO app_customers(id,username,email,mobile,full_name,password_hash) VALUES(UNHEX(REPLACE(?,'-','')),?,?,?,?,?)")) {
        insert.setString(1,id);insert.setString(2,username);insert.setString(3,email);insert.setString(4,"+916000000001");
        insert.setString(5,"Isolated Local Tester");insert.setString(6,new BCryptPasswordEncoder().encode("LocalQaOnly9"));insert.executeUpdate();
      }
      System.out.println("{\"customerId\":\""+id+"\",\"email\":\""+email+"\"}");
    }
  }
}
