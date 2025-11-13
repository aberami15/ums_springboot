package com.example.demo.config;

import com.example.demo.model.User;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setFullname("System Administrator");
        admin.setEmail("admin@example.com");
        admin.setGender("Male");
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);

        User admin2 = new User();
        admin2.setUsername("admin2");
        admin2.setPassword(passwordEncoder.encode("admin123"));
        admin2.setFullname("Second Administrator");
        admin2.setEmail("admin2@example.com");
        admin2.setGender("Female");
        admin2.setRole(UserRole.ADMIN);
        userRepository.save(admin2);

        User user1 = new User();
        user1.setUsername("john");
        user1.setPassword(passwordEncoder.encode("user123"));
        user1.setFullname("John Doe");
        user1.setEmail("john@example.com");
        user1.setGender("Male");
        user1.setRole(UserRole.USER);
        userRepository.save(user1);

        User user2 = new User();
        user2.setUsername("jane");
        user2.setPassword(passwordEncoder.encode("user123"));
        user2.setFullname("Jane Smith");
        user2.setEmail("jane@example.com");
        user2.setGender("Female");
        user2.setRole(UserRole.USER);
        userRepository.save(user2);

        User user3 = new User();
        user3.setUsername("bob");
        user3.setPassword(passwordEncoder.encode("user123"));
        user3.setFullname("Bob Wilson");
        user3.setEmail("bob@example.com");
        user3.setGender("Male");
        user3.setRole(UserRole.USER);
        userRepository.save(user3);

        System.out.println("Sample data initialized successfully!");
        System.out.println("Login Credentials:");
        System.out.println("   Admin: admin / admin123");
        System.out.println("   Admin: admin2 / admin123");
        System.out.println("   User: john / user123");
        System.out.println("   User: jane / user123");
        System.out.println("   User: bob / user123");
    }
}