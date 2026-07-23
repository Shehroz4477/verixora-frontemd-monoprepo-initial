import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { describeApiError } from '../core/utils/api-error';

interface ActionResponse {
  success: boolean;
  message: string;
}

interface EmailStatusResponse {
  email: string | null;
  isVerified: boolean;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false
})
export class ProfileComponent implements OnInit {
  readonly title = 'Security settings';
  email = '';
  verificationCode = '';
  emailSaved = false;
  emailVerified = false;
  isLoadingEmailStatus = true;
  isSavingEmail = false;
  isSendingCode = false;
  isVerifying = false;
  message = '';
  errorMessage = '';

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    void this.loadEmailStatus();
  }

  goBack(): void {
    this.router.navigate(['tabs/home']);
  }

  get isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  get isVerificationCodeValid(): boolean {
    return /^\d{6}$/.test(this.verificationCode.trim());
  }

  onEmailChanged(): void {
    this.emailSaved = false;
    this.emailVerified = false;
  }

  async saveEmail(): Promise<void> {
    this.clearMessages();
    const email = this.email.trim();
    if (!email) {
      this.errorMessage = 'Enter the email address you want to verify for web portal access.';
      return;
    }
    if (!this.isEmailValid) {
      this.errorMessage = 'Enter a complete email address, for example name@example.com.';
      return;
    }
    if (this.auth.isMockMode()) {
      this.email = email;
      this.emailSaved = true;
      this.emailVerified = false;
      this.message = 'Mock email saved. Production requires an OTP verification before web portal access.';
      return;
    }

    this.isSavingEmail = true;
    try {
      const result = await firstValueFrom(this.api.post<ActionResponse>('/auth/set-email', { email }));
      this.email = email;
      this.emailSaved = true;
      this.emailVerified = false;
      this.message = result.message || 'Email saved. Send a verification code to continue.';
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Could not save this email address.');
    } finally {
      this.isSavingEmail = false;
    }
  }

  async sendVerificationCode(): Promise<void> {
    this.clearMessages();
    if (!this.emailSaved) {
      this.errorMessage = 'Save an email address before requesting a verification code.';
      return;
    }
    if (this.emailVerified) {
      this.message = 'This email is already verified for web portal access.';
      return;
    }
    if (this.auth.isMockMode()) {
      this.message = 'Mock verification code sent. Use 123456 in local demo mode.';
      return;
    }

    this.isSendingCode = true;
    try {
      const result = await firstValueFrom(this.api.post<ActionResponse>('/auth/send-verification-email', {}));
      this.message = result.message || 'Verification code sent. Enter it below on this trusted device.';
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Could not send a verification code.');
    } finally {
      this.isSendingCode = false;
    }
  }

  async verifyEmail(): Promise<void> {
    this.clearMessages();
    const code = this.verificationCode.trim();
    if (!this.isVerificationCodeValid) {
      this.errorMessage = 'Enter the six-digit verification code sent to your email.';
      return;
    }
    if (this.auth.isMockMode()) {
      if (code === '123456') {
        this.emailVerified = true;
        this.verificationCode = '';
        this.message = 'Mock email verified. Web portal access is enabled.';
      }
      else this.errorMessage = 'The mock verification code is invalid.';
      return;
    }

    this.isVerifying = true;
    try {
      const result = await firstValueFrom(this.api.post<ActionResponse>('/auth/verify-email', { code }));
      this.verificationCode = '';
      this.emailVerified = true;
      this.message = result.message || 'Email verified. You can now use the web portal with this email and password.';
    } catch (error) {
      this.errorMessage = this.apiError(error, 'The verification code is invalid or expired.');
    } finally {
      this.isVerifying = false;
    }
  }

  openFaceEnrollment(): void {
    this.router.navigate(['/tabs/face-enrollment']);
  }

  logout(): void {
    this.auth.logout();
  }

  private clearMessages(): void {
    this.message = '';
    this.errorMessage = '';
  }

  private async loadEmailStatus(): Promise<void> {
    if (this.auth.isMockMode()) {
      this.isLoadingEmailStatus = false;
      return;
    }

    try {
      const result = await firstValueFrom(this.api.get<EmailStatusResponse>('/auth/email-status'));
      this.email = result.email ?? '';
      this.emailSaved = Boolean(result.email);
      this.emailVerified = result.isVerified;
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Could not load your email verification status.');
    } finally {
      this.isLoadingEmailStatus = false;
    }
  }

  private apiError(error: unknown, fallback: string): string {
    return describeApiError(error, fallback);
  }
}
