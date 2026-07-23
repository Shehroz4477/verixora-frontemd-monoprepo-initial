import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { describeApiError } from '../core/utils/api-error';

interface ActionResponse {
  success: boolean;
  message: string;
}

interface FaceDeletionResponse {
  status: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false
})
export class ProfileComponent {
  readonly title = 'Security settings';
  email = '';
  verificationCode = '';
  emailSaved = false;
  isSavingEmail = false;
  isSendingCode = false;
  isVerifying = false;
  isDeletingFace = false;
  message = '';
  errorMessage = '';

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

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
      this.message = 'Mock email saved. Production requires an OTP verification before web portal access.';
      return;
    }

    this.isSavingEmail = true;
    try {
      const result = await firstValueFrom(this.api.post<ActionResponse>('/auth/set-email', { email }));
      this.email = email;
      this.emailSaved = true;
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
      if (code === '123456') this.message = 'Mock email verified. Web portal access is enabled.';
      else this.errorMessage = 'The mock verification code is invalid.';
      return;
    }

    this.isVerifying = true;
    try {
      const result = await firstValueFrom(this.api.post<ActionResponse>('/auth/verify-email', { code }));
      this.verificationCode = '';
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

  async deleteFaceEnrollment(): Promise<void> {
    this.clearMessages();
    if (!window.confirm('Delete your enrolled face templates? Face-required doors will reject unlock requests until you enroll again.')) {
      return;
    }
    if (this.auth.isMockMode()) {
      this.message = 'Mock face enrollment deleted. Face-required doors now require a new enrollment.';
      return;
    }

    this.isDeletingFace = true;
    try {
      const result = await firstValueFrom(this.api.delete<FaceDeletionResponse>('/face/enrollment'));
      this.message = result.status === 'deleted'
        ? 'Face enrollment deleted. Face-required doors will remain locked until you enroll again.'
        : 'Face enrollment removal was requested.';
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Could not delete the face enrollment.');
    } finally {
      this.isDeletingFace = false;
    }
  }

  logout(): void {
    this.auth.logout();
  }

  private clearMessages(): void {
    this.message = '';
    this.errorMessage = '';
  }

  private apiError(error: unknown, fallback: string): string {
    return describeApiError(error, fallback);
  }
}
