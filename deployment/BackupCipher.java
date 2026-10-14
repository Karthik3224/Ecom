import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;

/** AES-256-GCM backup envelope. Keys and plaintext never appear in console output. */
public class BackupCipher {
  private static final byte[] HEADER="ECOMBK01".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
  public static void main(String[] args) throws Exception {
    if(args.length==2 && args[0].equals("keygen")) {
      byte[] key=new byte[32];new SecureRandom().nextBytes(key);
      Files.write(Path.of(args[1]),key,StandardOpenOption.CREATE_NEW);Arrays.fill(key,(byte)0);
      System.out.println("Key created; restrict access and escrow separately");return;
    }
    if(args.length!=4 || !Set.of("encrypt","decrypt").contains(args[0])) throw new IllegalArgumentException("Usage: keygen keyfile | encrypt/decrypt input output keyfile");
    Path input=Path.of(args[1]).toAbsolutePath(),output=Path.of(args[2]).toAbsolutePath(),keyPath=Path.of(args[3]).toAbsolutePath();
    if(Files.exists(output) || input.equals(output) || keyPath.equals(output) || input.equals(keyPath)) throw new IllegalArgumentException("Distinct input/output/key paths and new output required");
    byte[] key=Files.readAllBytes(keyPath);if(key.length!=32)throw new IllegalArgumentException("AES-256 key required");
    byte[] nonce=new byte[12];boolean encrypt=args[0].equals("encrypt");
    Path temporary=Files.createTempFile(output.getParent(),".backup-recovery-",".tmp");
    try(var source=new DataInputStream(Files.newInputStream(input));var target=Files.newOutputStream(temporary)) {
      if(encrypt){new SecureRandom().nextBytes(nonce);target.write(HEADER);target.write(nonce);}
      else {if(!Arrays.equals(source.readNBytes(HEADER.length),HEADER))throw new GeneralSecurityException("Invalid backup envelope");source.readFully(nonce);}
      var cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(encrypt?Cipher.ENCRYPT_MODE:Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,nonce));cipher.updateAAD(HEADER);
      byte[] buffer=new byte[65536];int count;
      while((count=source.read(buffer))!=-1){byte[] part=cipher.update(buffer,0,count);if(part!=null)target.write(part);}
      byte[] finalBytes=cipher.doFinal();if(finalBytes!=null)target.write(finalBytes);
    } catch(Exception ex){Files.deleteIfExists(temporary);throw ex;}
    finally{Arrays.fill(key,(byte)0);}
    try{Files.move(temporary,output);}finally{Files.deleteIfExists(temporary);}
    System.out.println(encrypt?"Encrypted backup created":"Authenticated backup recovery completed");
  }
}
