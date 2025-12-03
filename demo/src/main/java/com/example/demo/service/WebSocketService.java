package com.example.demo.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Broadcast user count to all connected clients
    public void sendUserCount(long count) {
        System.out.println("Broadcasting user count: " + count);
        messagingTemplate.convertAndSend("/topic/user-count", count);
    }

    // Send notification message to all connected clients
    // Called when any user-related action occurs
    public void sendNotification(String message) {
        System.out.println("Sending notification: " + message);
        messagingTemplate.convertAndSend("/topic/notifications", message);
    }
}