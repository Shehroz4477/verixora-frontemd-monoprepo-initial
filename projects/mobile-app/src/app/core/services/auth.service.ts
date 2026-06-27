import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, delay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { environment } from './../../../../environments/environment';

interface AuthData {
  token: string;
  userId: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private authData: AuthData | null = null;

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    this.loadAuthData();
  }

  private async loadAuthData(): Promise<void> {
    const data = await this.storage.get<AuthData>('auth');
    if (data && data.expiresAt > Date.now()) {
      this.authData = data;
      this.isLoggedInSubject.next(true);
    } else {
      await this.logout();
    }
  }

  isMockMode(): boolean {
    return environment.useMock;
  }

  sendLoginOtp(phoneNumber: string, password: string, deviceFingerprint: string): Observable<any> {
    if (this.isMockMode()) {
      return of({ success: true, message: 'OTP sent (mock: 123456)' }).pipe(delay(500));
    }
    return this.api.post('/auth/send-login-otp', { phoneNumber, password, deviceFingerprint });
  }

  login(phoneNumber: string, password: string, otp: string): Observable<any> {
    if (this.isMockMode()) {
      if (otp === '123456') {
        const mockData: AuthData = {
          token: 'mock-jwt-token',
          userId: 'mock-user-id',
          expiresAt: Date.now() + 15 * 60 * 1000
        };
        return new Observable(observer => {
          this.handleAuthSuccess(mockData).then(() => {
            observer.next({ token: mockData.token, userId: mockData.userId });
            observer.complete();
          }).catch(err => observer.error(err));
        });
      } else {
        return throwError(() => ({ error: { error: 'Invalid OTP' } }));
      }
    }

    return this.api.post<{ token: string; userId: string }>('/auth/login', {
      phoneNumber,
      password,
      otp
    }).pipe(
      tap(async (response) => {
        const authData: AuthData = {
          token: response.token,
          userId: response.userId,
          expiresAt: Date.now() + 15 * 60 * 1000
        };
        await this.handleAuthSuccess(authData);
      })
    );
  }

  sendRegistrationOtp(phoneNumber: string, deviceFingerprint: string): Observable<any> {
    if (this.isMockMode()) {
      return of({ success: true, message: 'OTP sent (mock: 123456)' }).pipe(delay(500));
    }
    return this.api.post('/auth/send-otp', { phoneNumber, deviceFingerprint });
  }

  register(phoneNumber: string, password: string, otp: string, email?: string): Observable<any> {
    if (this.isMockMode()) {
      return of({ success: true, userId: 'mock-user-id' }).pipe(delay(500));
    }
    return this.api.post('/auth/register', {
      phoneNumber,
      password,
      confirmPassword: password,
      otp,
      email: email || ''
    });
  }

  private async handleAuthSuccess(data: AuthData): Promise<void> {
    this.authData = data;
    await this.storage.set('auth', data);
    this.isLoggedInSubject.next(true);
  }

  async logout(): Promise<void> {
    this.authData = null;
    await this.storage.remove('auth');
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.authData) return null;
    if (this.authData.expiresAt < Date.now()) {
      this.logout();
      return null;
    }
    return this.authData.token;
  }

  getUserId(): string | null {
    return this.authData?.userId || null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}