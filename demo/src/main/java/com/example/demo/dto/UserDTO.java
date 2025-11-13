package com.example.demo.dto;

import com.example.demo.model.UserRole;

public class UserDTO {

    private Long id;
    private String username;
    private String fullname;
    private String email;
    private String gender;
    private UserRole role;
    private String profilePhoto;

    public UserDTO() {}

    public UserDTO(Long id, String username, String fullname, String email, String gender, UserRole role, String profilePhoto) {
        this.id = id;
        this.username = username;
        this.fullname = fullname;
        this.email = email;
        this.gender = gender;
        this.role = role;
        this.profilePhoto = profilePhoto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
    }
}