package com.metaarch.orgaccess.customer;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(assignableTypes={CustomerAuthController.class,CustomerAccountController.class,com.metaarch.orgaccess.auth.AuthController.class})
public class CustomerAuthErrors {
  private static final String MESSAGE = "message";

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<Map<String,String>> status(ResponseStatusException error) { return ResponseEntity.status(error.getStatusCode()).body(Map.of(MESSAGE,error.getReason()==null?"Request failed.":error.getReason())); }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException error) { return ResponseEntity.badRequest().body(Map.of(MESSAGE,error.getBindingResult().getFieldErrors().stream().map(e->e.getField()+": "+e.getDefaultMessage()).findFirst().orElse("Invalid request."))); }
  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<Map<String,String>> duplicate(DataIntegrityViolationException error) { return ResponseEntity.status(409).body(Map.of(MESSAGE,"Email or mobile number already exists.")); }
  @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
  ResponseEntity<Map<String,String>> credentials(Exception error) { return ResponseEntity.status(401).body(Map.of(MESSAGE,"Incorrect credentials or account unavailable.")); }
}
