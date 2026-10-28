package com.fraud.transaction_service.platform;
import feign.RequestInterceptor;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.context.request.*;

@Configuration @RequiredArgsConstructor
public class AccessConfiguration implements WebMvcConfigurer {
    private final AuthService auth;
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) {
                if(!"OPTIONS".equals(request.getMethod())) auth.authenticate(request.getHeader("Authorization"));
                return true;
            }
        }).addPathPatterns("/api/**","/features/**","/devices/**","/locations/**","/merchants/**").excludePathPatterns("/api/auth/login","/api/auth/register");
    }
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins("*").allowedHeaders("*").allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS");
    }
    @Bean public RequestInterceptor forwardAuthorization() {
        return template->{
            if(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
                String header=attrs.getRequest().getHeader("Authorization");
                if(header!=null)template.header("Authorization",header);
            }
        };
    }
}
