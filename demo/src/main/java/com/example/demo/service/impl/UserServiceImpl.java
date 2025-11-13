package com.example.demo.service.impl;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UpdateProfileRequest;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.model.User;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUser(Long id, User user) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    existingUser.setUsername(user.getUsername());
                    existingUser.setFullname(user.getFullname());
                    existingUser.setEmail(user.getEmail());
                    existingUser.setGender(user.getGender());
                    existingUser.setRole(user.getRole());
                    existingUser.setProfilePhoto(user.getProfilePhoto());
                    if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                        existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
                    }
                    return userRepository.save(existingUser);
                })
                .orElse(null);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
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

        return userRepository.save(user);
    }

    @Override
    @Transactional
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

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUserByAdmin(String username, String currentUsername) {
        if (username.equals(currentUsername)) {
            throw new RuntimeException("You cannot delete your own account");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);
    }

    @Override
    @Transactional
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
        return userRepository.save(user);
    }

    @Override
    public long countAdmins() {
        return userRepository.countByRole(UserRole.ADMIN);
    }

    @Override
    @Transactional
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