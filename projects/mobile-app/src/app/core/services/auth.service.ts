import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { SecureStorageService } from './secure-storage.service';
import { DeviceService } from './device.service';
import { environment } from './../../../../environments/environment';

interface AuthData {
  token: string;
  userId: string;
  expiresAt: number;
}

interface AuthResponse {
  token: string;
  userId: string;
}

export interface AuthAccessEligibility {
  canRegister: boolean;
  canLogin: boolean;
  deviceStatus: 'New' | 'Registered';
  phoneStatus: 'NotChecked' | 'Available' | 'NotRegistered' | 'RegisteredToThisDevice' | 'RegisteredToAnotherDevice';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private authData: AuthData | null = null;
  private readonly initialization: Promise<void>;

  constructor(
    private api: ApiService,
    private secureStorage: SecureStorageService,
    private device: DeviceService,
    private router: Router
  ) {
    this.initialization = this.loadAuthData();
  }

  private async loadAuthData(): Promise<void> {
    const data = await this.secureStorage.get<AuthData>('auth');
    if (data && data.expiresAt > Date.now()) {
      this.authData = data;
      this.isLoggedInSubject.next(true);
    } else {
      this.authData = null;
      await this.secureStorage.remove('auth');
      this.isLoggedInSubject.next(false);
    }
  }

  isMockMode(): boolean {
    return environment.useMock;
  }

  async sendLoginOtp(phoneNumber: string, password: string): Promise<Observable<any>> {
    if (this.isMockMode()) {
      return of({ success: true, message: 'OTP sent (mock: 123456)' }).pipe(delay(500));
    }
    const binding = await this.device.getDeviceBinding();
    return this.api.post('/auth/send-login-otp', { phoneNumber, password, ...binding });
  }

  async login(phoneNumber: string, password: string, otp: string): Promise<Observable<AuthResponse>> {
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

    const binding = await this.device.getDeviceBinding();
    return this.api.post<AuthResponse>('/auth/login', {
      phoneNumber,
      password,
      otp,
      ...binding
    }).pipe(switchMap(response => this.persistAuthenticatedResponse(response)));
  }

  async getAccessEligibility(phoneNumber?: string): Promise<Observable<AuthAccessEligibility>> {
    if (this.isMockMode()) {
      return of({
        canRegister: !phoneNumber,
        canLogin: !!phoneNumber,
        deviceStatus: phoneNumber ? 'Registered' : 'New',
        phoneStatus: phoneNumber ? 'RegisteredToThisDevice' : 'NotChecked',
        message: phoneNumber ? 'This number is registered on this device. Sign in to continue.' : 'This is a new device. Create an account to continue.'
      });
    }

    const binding = await this.device.getDeviceBinding();
    return this.api.post<AuthAccessEligibility>('/auth/access-eligibility', {
      deviceId: binding.deviceId,
      phoneNumber: phoneNumber?.trim() || null
    });
  }

  async sendRegistrationOtp(phoneNumber: string): Promise<Observable<any>> {
    if (this.isMockMode()) {
      return of({ success: true, message: 'OTP sent (mock: 123456)' }).pipe(delay(500));
    }
    const binding = await this.device.getDeviceBinding();
    return this.api.post('/auth/send-otp', { phoneNumber, deviceId: binding.deviceId });
  }

  async register(phoneNumber: string, password: string, otp: string, email?: string): Promise<Observable<AuthResponse>> {
    if (this.isMockMode()) {
      return of({ token: 'mock-jwt-token', userId: 'mock-user-id' }).pipe(
        delay(500),
        switchMap(response => this.persistAuthenticatedResponse(response))
      );
    }
    const binding = await this.device.getDeviceBinding();
    return this.api.post<AuthResponse>('/auth/register', {
      phoneNumber,
      password,
      confirmPassword: password,
      otp,
      email: email || '',
      ...binding
    }).pipe(switchMap(response => this.persistAuthenticatedResponse(response)));
  }

  private async handleAuthSuccess(data: AuthData): Promise<void> {
    this.authData = data;
    await this.secureStorage.set('auth', data);
    this.isLoggedInSubject.next(true);
  }

  private persistAuthenticatedResponse(response: AuthResponse): Observable<AuthResponse> {
    const authData: AuthData = {
      token: response.token,
      userId: response.userId,
      expiresAt: this.readJwtExpiry(response.token)
    };

    return from(this.handleAuthSuccess(authData)).pipe(map(() => response));
  }

  async logout(): Promise<void> {
    this.authData = null;
    await this.secureStorage.remove('auth');
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

  async isAuthenticatedAfterInitialization(): Promise<boolean> {
    await this.initialization;
    return this.isAuthenticated();
  }

  private readJwtExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : Date.now() + 15 * 60 * 1000;
    } catch {
      return Date.now() + 15 * 60 * 1000;
    }
  }
}
