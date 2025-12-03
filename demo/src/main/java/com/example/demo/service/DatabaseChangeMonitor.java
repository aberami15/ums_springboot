package com.example.demo.service;

import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class DatabaseChangeMonitor {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WebSocketService webSocketService;

    private long lastKnownUserCount = 0;
    private boolean isInitialized = false;

    // Check database for changes every 2 seconds
    @Scheduled(fixedRate = 2000)
    public void monitorUserCountChanges() {
        try {
            // Get current user count from database
            long currentCount = userRepository.count();

            // Initialize on first run
            if (!isInitialized) {
                lastKnownUserCount = currentCount;
                isInitialized = true;
                System.out.println("Database monitor initialized. Current user count: " + currentCount);
                return;
            }

            // Check if count has changed
            if (currentCount != lastKnownUserCount) {
                long difference = currentCount - lastKnownUserCount;

                System.out.println("DATABASE CHANGE DETECTED!");
                System.out.println("Previous count: " + lastKnownUserCount);
                System.out.println("Current count: " + currentCount);
                System.out.println("Difference: " + (difference > 0 ? "+" : "") + difference);

                // Broadcast the new count to all connected clients
                webSocketService.sendUserCount(currentCount);

                // Send appropriate notification
                if (difference > 0) {
                    webSocketService.sendNotification("Database updated: " + difference + " user added");
                } else {
                    webSocketService.sendNotification("Database updated: " + Math.abs(difference) + " user removed");
                }

                // Update last known count
                lastKnownUserCount = currentCount;
            }

        } catch (Exception e) {
            System.err.println("Error monitoring database changes: " + e.getMessage());
        }
    }
}