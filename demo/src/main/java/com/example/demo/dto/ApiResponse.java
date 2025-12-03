package com.example.demo.dto;

public class ApiResponse<T> {
    private String status;
    private String description;
    private T data;

    public ApiResponse() {
    }

    public ApiResponse(String status, String description, T data) {
        this.status = status;
        this.description = description;
        this.data = data;
    }

    // Success response with data
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("00", "Success", data);
    }

    // Success response with custom message
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>("00", message, data);
    }

    // Error response
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>("01", message, null);
    }

    // Getters and Setters
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}