import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { describeApiError } from '../core/utils/api-error';
import { StorageService } from '../core/services/storage.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-otp-page',
    templateUrl: './otp-page.component.html',
    styleUrls: ['./otp-page.component.scss'],
    standalone: false
})
export class OtpPageComponent implements OnInit, OnDestroy {
  timer: number = 0;
  isLoading: boolean = false;
  isResending: boolean = false;
  errorMessage: string = '';
  otp: string = '';
  readonly isDevelopmentBuild = !environment.production;
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
    const state = (navigation?.extras?.state ?? history.state) as {
      phone: string;
      password: string;
      email?: string;
      isRegistration?: boolean;
    };
    if (state?.phone && state?.password) {
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

    try {
      const request = this.isRegistration
        ? await this.auth.register(this.phoneNumber, this.password, this.otp, this.email)
        : await this.auth.login(this.phoneNumber, this.password, this.otp);

      request
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.storage.set('registered_phone', this.phoneNumber);
            this.router.navigate(['/tabs/home']);
          },
          error: (err) => {
            this.errorMessage = describeApiError(err, this.isRegistration
              ? 'Registration failed. Please try again.'
              : 'The verification code is invalid or expired.');
          }
        });
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = describeApiError(error, 'Could not verify this code. Check your connection and try again.');
    }
  }

  async resend() {
    if (this.timer > 0 || this.isResending) return;

    this.errorMessage = '';
    this.isResending = true;
    try {
      const request = this.isRegistration
        ? await this.auth.sendRegistrationOtp(this.phoneNumber)
        : await this.auth.sendLoginOtp(this.phoneNumber, this.password);
      request.pipe(finalize(() => this.isResending = false)).subscribe({
        next: () => {
          this.startTimer(60);
          this.otp = '';
        },
        error: (err) => {
          this.errorMessage = describeApiError(err, 'Could not resend the verification code.');
        }
      });
    } catch (error) {
      this.isResending = false;
      this.errorMessage = describeApiError(error, 'Could not resend the verification code.');
    }
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
