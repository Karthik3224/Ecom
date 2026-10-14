package com.metaarch.orgaccess.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtTokenProvider tokenProvider;
  private final DatabaseUserDetailsService users;

  public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, DatabaseUserDetailsService users) {
    this.tokenProvider = tokenProvider;
    this.users = users;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      try {
        if (tokenProvider.validateToken(token)) {
        String username = tokenProvider.getUsername(token);
        var user = tokenProvider.isCustomerToken(token) ? org.springframework.security.core.userdetails.User.withUsername(username).password("").roles("CUSTOMER").build() : users.loadUserByUsername(username);
        List<SimpleGrantedAuthority> authorities = user.getAuthorities().stream()
          .map(authority -> new SimpleGrantedAuthority(authority.getAuthority()))
          .toList();
        UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(username, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      } catch (RuntimeException ignored) {
        SecurityContextHolder.clearContext();
      }
    }
    filterChain.doFilter(request, response);
  }
}
