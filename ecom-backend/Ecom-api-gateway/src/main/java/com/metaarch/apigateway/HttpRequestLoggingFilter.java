package com.metaarch.apigateway;

import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class HttpRequestLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log =
            LoggerFactory.getLogger(HttpRequestLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String method = request.getMethod() != null
                ? request.getMethod().name() : "UNKNOWN";
        String path = request.getURI().getRawPath();
        long start = System.nanoTime();

        log.info("HTTP_IN method={} path={}", method, path);

        return chain.filter(exchange)
                .doFinally(signal -> {
                    int status = exchange.getResponse().getStatusCode() != null
                            ? exchange.getResponse().getStatusCode().value()
                            : 500;
                    long durationMs = TimeUnit.NANOSECONDS.toMillis(
                            System.nanoTime() - start);

                    log.info(
                            "HTTP_OUT method={} path={} status={} duration_ms={} outcome={}",
                            method, path, status, durationMs, signal);
                });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
