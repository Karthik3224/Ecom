package com.metaarch.inventory.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ResourceNotFoundException.class) ResponseEntity<Map<String,Object>> notFound(ResourceNotFoundException e, WebRequest r) { return error(404, e.getMessage(), r); }
  @ExceptionHandler({ConflictException.class, InsufficientStockException.class, DataIntegrityViolationException.class, ObjectOptimisticLockingFailureException.class})
  ResponseEntity<Map<String,Object>> conflict(Exception e, WebRequest r) {
    String m = e instanceof ConflictException || e instanceof InsufficientStockException ? e.getMessage() : "Request conflicts with existing inventory data";
    return error(409, m, r);
  }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String,Object>> validation(MethodArgumentNotValidException e, WebRequest r) {
    Map<String,String> fields = e.getBindingResult().getFieldErrors().stream().collect(Collectors.toMap(x -> x.getField(), x -> Optional.ofNullable(x.getDefaultMessage()).orElse("invalid"), (a,b) -> a, LinkedHashMap::new));
    Map<String,Object> body = body(400, "Validation failed", r); body.put("fields", fields); return ResponseEntity.badRequest().body(body);
  }
  @ExceptionHandler(ConstraintViolationException.class) ResponseEntity<Map<String,Object>> constraint(ConstraintViolationException e, WebRequest r) { return error(400, e.getMessage(), r); }
  @ExceptionHandler(IllegalArgumentException.class) ResponseEntity<Map<String,Object>> badRequest(IllegalArgumentException e, WebRequest r) { return error(400, e.getMessage(), r); }
  private ResponseEntity<Map<String,Object>> error(int status, String message, WebRequest r) { return ResponseEntity.status(status).body(body(status, message, r)); }
  private Map<String,Object> body(int status, String message, WebRequest r) {
    Map<String,Object> m = new LinkedHashMap<>(); m.put("timestamp", Instant.now()); m.put("status", status); m.put("error", HttpStatus.valueOf(status).getReasonPhrase()); m.put("message", message); m.put("path", r.getDescription(false).replace("uri=", "")); return m;
  }
}
