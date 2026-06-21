import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  phoneNumber: string = '';
  password: string = '';
  otp: string = '';
  showOtpInput: boolean = false;
  message: string = '';
  isError: boolean = false;

  constructor(private router: Router) {}

  // Step 1: Request OTP
  sendOtp() {
    if (!this.phoneNumber || !this.password) {
      this.showMessage('Please enter phone number and password.', true);
      return;
    }

    // Simulate API call – replace with actual HTTP request later
    this.message = 'Sending OTP...';
    this.isError = false;

    setTimeout(() => {
      // In production: call backend /auth/send-login-otp
      this.showOtpInput = true;
      this.showMessage('OTP sent to your phone! (Mock: 123456)', false);
    }, 1500);
  }

  // Step 2: Login with OTP
  login() {
    if (!this.otp || this.otp.length < 6) {
      this.showMessage('Please enter a valid 6-digit OTP.', true);
      return;
    }

    // Simulate API call – replace with actual HTTP request later
    this.message = 'Verifying OTP...';
    this.isError = false;

    setTimeout(() => {
      // In production: call backend /auth/login with phone + password + otp
      // Mock: accept any OTP except "111111" (to test failure)
      if (this.otp === '111111') {
        this.showMessage('Invalid OTP. Please try again.', true);
        return;
      }

      // Success – navigate to dashboard
      this.showMessage('Login successful!', false);
      setTimeout(() => {
        // this.router.navigate(['/dashboard']); // uncomment later
        console.log('Navigating to dashboard...');
        // For now, just show success.
        this.message = '✅ Welcome to Verixora! (Dashboard coming soon)';
      }, 500);
    }, 1500);
  }

  goToRegister() {
    // Placeholder: navigate to registration page later
    this.showMessage('Registration page coming soon.', false);
  }

  private showMessage(text: string, isError: boolean) {
    this.message = text;
    this.isError = isError;
  }
}