package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.dto.UserDTO;
import com.example.demo.model.User;
import com.example.demo.service.UserService;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            List<UserDTO> dtos = users.stream()
                    .map(userMapper::toDTO)
                    .toList();
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            User user = userService.createUserByAdmin(request);
            return ResponseEntity.ok(ApiResponse.success("User created successfully", userMapper.toDTO(user)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/users")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(@Valid @RequestBody UpdateUserRequest request) {
        try {
            User updatedUser = userService.updateUserByAdmin(request);
            return ResponseEntity.ok(ApiResponse.success("User updated successfully", userMapper.toDTO(updatedUser)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/users")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = authentication.getName();

            userService.deleteUserByAdmin(username, currentUsername);
            return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/downgrade")
    public ResponseEntity<ApiResponse<UserDTO>> downgradeAccount(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = authentication.getName();

            User user = userService.downgradeAdmin(username, currentUsername);
            return ResponseEntity.ok(ApiResponse.success("Account downgraded successfully", userMapper.toDTO(user)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/admin-count")
    public ResponseEntity<ApiResponse<Long>> getAdminCount() {
        try {
            long count = userService.countAdmins();
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }
}