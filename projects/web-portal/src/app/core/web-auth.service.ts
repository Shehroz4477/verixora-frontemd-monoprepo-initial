import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebApiService } from './web-api.service';

interface WebSession {
  token: string;
  userId: string;
  expiresAt: number;
}

interface LoginResponse {
  token: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class WebAuthService {
  private readonly storageKey = 'verixora_web_session';
  private readonly signedInSubject = new BehaviorSubject<boolean>(this.readSession() !== null);
  readonly signedIn$ = this.signedInSubject.asObservable();

  constructor(private api: WebApiService, private router: Router) {}

  sendOtp(email: string, password: string): Observable<unknown> {
    return this.api.post('/auth/web/send-login-otp', { email, password });
  }

  login(email: string, password: string, otp: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/web/login', { email, password, otp }).pipe(
      tap(response => this.storeSession({ token: response.token, userId: response.userId, expiresAt: this.readJwtExpiry(response.token) }))
    );
  }

  token(): string | null {
    const session = this.readSession();
    if (!session || session.expiresAt <= Date.now()) {
      this.clearSession();
      return null;
    }
    return session.token;
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private storeSession(session: WebSession): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    this.signedInSubject.next(true);
  }

  private readSession(): WebSession | null {
    try {
      const serialized = sessionStorage.getItem(this.storageKey);
      if (!serialized) return null;
      const session = JSON.parse(serialized) as WebSession;
      return session.expiresAt > Date.now() ? session : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.storageKey);
    this.signedInSubject.next(false);
  }

  private readJwtExpiry(token: string): number {
    try {
      const value = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(value));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : Date.now() + 15 * 60 * 1000;
    } catch {
      return Date.now() + 15 * 60 * 1000;
    }
  }
}
