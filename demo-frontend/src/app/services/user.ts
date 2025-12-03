import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface User {
  id?: number;
  username: string;
  fullname: string;
  email: string;
  gender: string;
  role: string;
  profilePhoto?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullname: string;
  email: string;
  gender: string;
  role: string;
  profilePhoto?: string;
}

export interface UpdateUserRequest {
  username: string;
  fullname: string;
  email: string;
  gender: string;
  role: string;
  profilePhoto?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileRequest {
  fullname: string;
  email: string;
  gender: string;
  profilePhoto?: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/update-profile`, request, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Public endpoint - accessible by all authenticated users
  getUserCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/public/user-count`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Admin-only endpoints
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/users`, request, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateUser(request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users`, request, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteUser(username: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users`, {
      headers: this.authService.getAuthHeaders(),
      body: { username }
    });
  }

  downgradeAdmin(username: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/downgrade`, { username }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getAdminCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/admin/admin-count`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
