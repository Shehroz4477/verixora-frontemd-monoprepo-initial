import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { StorageService } from '../core/services/storage.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-otp-page',
    templateUrl: './otp-page.component.html',
    styleUrls: ['./otp-page.component.scss'],
    standalone: false
})
export class OtpPageComponent implements OnInit, OnDestroy {
  timer: number = 0;
  isLoading: boolean = false;
  errorMessage: string = '';
  otp: string = '';
  private timerInterval: any;

  // State from navigation
  private phoneNumber: string = '';
  private password: string = '';
  private email: string = '';
  private isRegistration: boolean = false;

  constructor(
    private auth: AuthService,
    private storage: StorageService,
    private router: Router
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as {
      phone: string;
      password: string;
      email?: string;
      isRegistration?: boolean;
    };
    if (state) {
      this.phoneNumber = state.phone;
      this.password = state.password;
      this.email = state.email || '';
      this.isRegistration = state.isRegistration || false;
      this.startTimer(60);
    } else {
      this.router.navigate(['/login']);
    }
  }

  onOtpComplete(otp: any) {
    this.otp = typeof otp === 'string' ? otp : '';
  }

  async verify() {
    if (!this.otp || this.otp.length < 6) {
      this.errorMessage = 'Please enter the complete 6-digit code.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isRegistration) {
      // Registration flow
      const registrationRequest = await this.auth.register(this.phoneNumber, this.password, this.otp, this.email);
      registrationRequest
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.storage.set('registered_phone', this.phoneNumber);
            this.router.navigate(['/tabs/home']);
          },
          error: (err) => {
            this.errorMessage = err.error?.error || 'Registration failed. Please try again.';
          }
        });
    } else {
      // Login flow
      const loginRequest = await this.auth.login(this.phoneNumber, this.password, this.otp);
      loginRequest
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.storage.set('registered_phone', this.phoneNumber);
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.errorMessage = err.error?.error || 'Invalid OTP. Please try again.';
          }
        });
    }
  }

  async resend() {
    if (this.timer > 0) return;

    this.errorMessage = '';
    // For registration or login, use appropriate OTP endpoint
    const obs = this.isRegistration
      ? await this.auth.sendRegistrationOtp(this.phoneNumber)
      : await this.auth.sendLoginOtp(this.phoneNumber, this.password);
    obs.subscribe({
      next: () => {
        this.startTimer(60);
        this.otp = '';
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to resend OTP.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  private startTimer(seconds: number) {
    this.timer = seconds;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.timer = 0;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
