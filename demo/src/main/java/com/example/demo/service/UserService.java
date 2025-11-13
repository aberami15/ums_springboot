package com.example.demo.service;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UpdateProfileRequest;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.model.User;
import java.util.List;

public interface UserService {
    List<User> getAllUsers();
    User findByUsername(String username);
    User getUserById(Long id);
    User createUser(User user);
    User updateUser(Long id, User user);
    void deleteUser(Long id);
    User createUserByAdmin(CreateUserRequest request);
    User updateUserByAdmin(UpdateUserRequest request);
    void deleteUserByAdmin(String username, String currentUsername);
    User downgradeAdmin(String username, String currentUsername);
    long countAdmins();
    User updateProfile(String username, UpdateProfileRequest request);
}