package com.example.demo.service;

import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class SessionService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String USER_SESSION_PREFIX = "user:session:";
    private static final long SESSION_TIMEOUT = 24;

    // Store user session in Redis
    public void createSession(String username, User user) {
        String key = USER_SESSION_PREFIX + username;
        redisTemplate.opsForValue().set(key, user, SESSION_TIMEOUT, TimeUnit.HOURS);
        System.out.println("Session created for user: " + username);
    }

    // Get user session from Redis
    public User getSession(String username) {
        String key = USER_SESSION_PREFIX + username;
        Object value = redisTemplate.opsForValue().get(key);
        if (value instanceof User) {
            System.out.println("Session retrieved from cache for user: " + username);
            return (User) value;
        }
        System.out.println("No session found in cache for user: " + username);
        return null;
    }

    // Update user session in Redis
    public void updateSession(String username, User user) {
        String key = USER_SESSION_PREFIX + username;
        redisTemplate.opsForValue().set(key, user, SESSION_TIMEOUT, TimeUnit.HOURS);
        System.out.println("Session updated for user: " + username);
    }

   // Delete user session from Redis
    public void deleteSession(String username) {
        String key = USER_SESSION_PREFIX + username;
        redisTemplate.delete(key);
        System.out.println("Session deleted for user: " + username);
    }

    // Refresh session timeout
    public void refreshSession(String username) {
        String key = USER_SESSION_PREFIX + username;
        redisTemplate.expire(key, SESSION_TIMEOUT, TimeUnit.HOURS);
        System.out.println("Session refreshed for user: " + username);
    }

    // Check if session exists
    public boolean sessionExists(String username) {
        String key = USER_SESSION_PREFIX + username;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}