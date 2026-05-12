import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface RegisterResponse {
  id: number;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'taskflow.accessToken';

  readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  login(login: string, password: string) {
    return this.http
      .post<{ accessToken: string }>(`${this.baseUrl}/login`, { login, password })
      .pipe(tap((res) => localStorage.setItem(this.tokenKey, res.accessToken)));
  }

  register(username: string, password: string) {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, {
      username,
      password
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }
}

