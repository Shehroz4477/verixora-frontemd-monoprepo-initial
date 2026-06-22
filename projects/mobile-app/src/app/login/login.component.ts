import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  phoneNumber: string = '';
  password: string = '';
  otp: string = '';
  showOtpInput: boolean = false;
  message: string = '';
  isError: boolean = false;
  otpTimer: number = 0;
  isLoading: boolean = false;
  private timerInterval: any;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  sendOtp() {
    if (!this.phoneNumber || !this.password) {
      this.showMessage('Please enter phone number and password.', true);
      return;
    }

    this.isLoading = true;
    this.showMessage('Sending OTP...', false);

    this.auth.sendLoginOtp(this.phoneNumber, this.password)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.showOtpInput = true;
          this.startTimer(60);
          this.showMessage('OTP sent to your phone!', false);
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'Failed to send OTP. Please try again.';
          this.showMessage(errorMsg, true);
        }
      });
  }

  login() {
    if (!this.otp || this.otp.length < 6) {
      this.showMessage('Please enter a valid 6-digit OTP.', true);
      return;
    }

    this.isLoading = true;
    this.showMessage('Verifying OTP...', false);

    this.auth.login(this.phoneNumber, this.password, this.otp)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.showMessage('Login successful!', false);
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 500);
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'Invalid OTP or credentials.';
          this.showMessage(errorMsg, true);
        }
      });
  }

  goToRegister() {
    this.showMessage('Please contact support to create an account.', false);
  }

  private startTimer(seconds: number) {
    this.otpTimer = seconds;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        clearInterval(this.timerInterval);
        this.otpTimer = 0;
      }
    }, 1000);
  }

  private showMessage(text: string, isError: boolean) {
    this.message = text;
    this.isError = isError;
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
