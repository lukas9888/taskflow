import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

type LoginResponse = { accessToken: string; expiresInSeconds: number };
type RegisterResponse = { id: number; username: string; email: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'taskflow.accessToken';

  readonly baseUrl = 'http://localhost:5046/api/auth';

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  login(login: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, { login, password })
      .pipe(tap((res) => localStorage.setItem(this.tokenKey, res.accessToken)));
  }

  register(username: string, email: string, password: string) {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, {
      username,
      email,
      password
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }
}

