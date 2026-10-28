package com.fraud.risk_score_service.config;
import com.fraud.risk_score_service.client.TransactionServiceClient;
import feign.FeignException;
import feign.RequestInterceptor;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;

@Configuration @RequiredArgsConstructor
public class AccessConfiguration implements WebMvcConfigurer {
    private final org.springframework.beans.factory.ObjectProvider<TransactionServiceClient> transactions;
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) {
                if("OPTIONS".equals(request.getMethod()))return true;
                String token=request.getHeader("Authorization");
                if(token==null || !token.startsWith("Bearer ")) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Please sign in");
                try { transactions.getObject().verifySession(token); }
                catch(FeignException e) {
                    if(e.status()==401)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Session expired. Please sign in again.");
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Account service is temporarily unavailable");
                }
                return true;
            }
        }).addPathPatterns("/api/**","/risk/**");
    }
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins("*").allowedHeaders("*").allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS");
    }
    @Bean public RequestInterceptor forwardAuthorization() {
        return template->{
            if("ml-service".equals(template.feignTarget().name()))return;
            if(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
                String header=attrs.getRequest().getHeader("Authorization");
                if(header!=null && !template.headers().containsKey("Authorization"))template.header("Authorization",header);
            }
        };
    }
}
