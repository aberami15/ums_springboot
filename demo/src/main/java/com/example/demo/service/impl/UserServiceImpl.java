package com.example.demo.service.impl;

import com.example.demo.service.WebSocketService;
import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UpdateProfileRequest;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.model.User;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final WebSocketService webSocketService;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           WebSocketService webSocketService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.webSocketService = webSocketService;
    }

    @Override
    public List<User> getAllUsers() {
        System.out.println("Fetching all users from database (real-time)");
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUserCount() {
        return userRepository.count();
    }

    @Override
    @Cacheable(value = "users", key = "#username")
    public User findByUsername(String username) {
        System.out.println("Fetching user from database: " + username);
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    @Transactional
    @CachePut(value = "users", key = "#result.username")
    public User createUserByAdmin(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setGender(request.getGender());
        user.setRole(request.getRole());
        user.setProfilePhoto(request.getProfilePhoto());

        User savedUser = userRepository.save(user);

        // Broadcast changes
        webSocketService.sendUserCount(userRepository.count());
        webSocketService.sendNotification("New user created: " + savedUser.getUsername());

        return savedUser;
    }

    @Override
    @Transactional
    @CachePut(value = "users", key = "#request.username")
    public User updateUserByAdmin(UpdateUserRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setGender(request.getGender());
        user.setRole(request.getRole());
        user.setProfilePhoto(request.getProfilePhoto());

        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);

        // Broadcast changes
        webSocketService.sendNotification("User updated: " + updatedUser.getUsername());

        return updatedUser;
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", key = "#username")
    public void deleteUserByAdmin(String username, String currentUsername) {
        if (username.equals(currentUsername)) {
            throw new RuntimeException("You cannot delete your own account");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);

        // Broadcast changes
        webSocketService.sendUserCount(userRepository.count());
        webSocketService.sendNotification("User deleted: " + username);
    }

    @Override
    @Transactional
    @CachePut(value = "users", key = "#username")
    public User downgradeAdmin(String username, String currentUsername) {
        if (!username.equals(currentUsername)) {
            throw new RuntimeException("You can only downgrade your own account");
        }

        long adminCount = userRepository.countByRole(UserRole.ADMIN);
        if (adminCount <= 1) {
            throw new RuntimeException("Cannot downgrade. At least one admin must remain in the system");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("User is not an admin");
        }

        user.setRole(UserRole.USER);
        User downgradedUser = userRepository.save(user);

        // Broadcast changes
        webSocketService.sendNotification("Admin downgraded: " + username);

        return downgradedUser;
    }

    @Override
    public long countAdmins() {
        return userRepository.countByRole(UserRole.ADMIN);
    }

    @Override
    @Transactional
    @CachePut(value = "users", key = "#username")
    public User updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setGender(request.getGender());
        user.setProfilePhoto(request.getProfilePhoto());

        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new RuntimeException("Current password is required to set a new password");
            }

            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        return userRepository.save(user);
    }
}