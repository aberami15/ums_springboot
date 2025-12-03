import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private connected = false;

  // BehaviorSubject to emit user count updates
  private userCountSubject = new BehaviorSubject<number>(0);
  public userCount$: Observable<number> = this.userCountSubject.asObservable();

  // BehaviorSubject for notifications
  private notificationSubject = new BehaviorSubject<string>('');
  public notification$: Observable<string> = this.notificationSubject.asObservable();

  constructor() {
    this.client = new Client();
  }

  // Connect to WebSocket server
  connect(): void {
    // Prevent multiple connections
    if (this.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Initializing WebSocket connection...');

    // Configure STOMP client with native WebSocket (no SockJS)
    this.client.configure({
      brokerURL: 'ws://localhost:8080/ws',
      debug: (str) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('WebSocket Connected!', frame);
        this.connected = true;

        // Subscribe to user count updates
        console.log('Subscribing to /topic/user-count...');
        this.client.subscribe('/topic/user-count', (message) => {
          try {
            const count = JSON.parse(message.body);
            console.log('User count message received:', count);
            console.log('Type:', typeof count);

            // Emit to subscribers
            this.userCountSubject.next(count);
            console.log('User count emitted to subscribers:', count);
          } catch (error) {
            console.error('Error parsing user count:', error);
            console.error('Raw message body:', message.body);
          }
        });

        // Subscribe to notifications
        console.log('Subscribing to /topic/notifications...');
        this.client.subscribe('/topic/notifications', (message) => {
          const notification = message.body;
          console.log('Notification message received:', notification);

          // Emit to subscribers
          this.notificationSubject.next(notification);
          console.log('Notification emitted to subscribers');
        });

        console.log('All subscriptions established');
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        this.connected = false;
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        this.connected = false;
      },
      onWebSocketError: (event) => {
        console.error('WebSocket Error:', event);
        this.connected = false;
      }
    });

    // Activate connection
    this.client.activate();
    console.log('WebSocket activation initiated');
  }

  disconnect(): void {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
      console.log('WebSocket Disconnected');
    }
  }
}
