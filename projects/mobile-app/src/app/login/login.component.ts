import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthAccessEligibility, AuthService } from '../core/services/auth.service';
import { CountryService } from '../core/services/country.service';
import { StorageService } from '../core/services/storage.service';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit {
  phoneNumber: string = '';
  password: string = '';
  dialCode: string = '+92';
  isPhoneReadOnly: boolean = false;
  message: string = '';
  messageType: 'info' | 'success' | 'error' = 'info';
  isLoading: boolean = false;
  isCheckingEligibility: boolean = true;
  eligibility: AuthAccessEligibility | null = null;
  phoneTouched: boolean = false;
  passwordTouched: boolean = false;

  constructor(
    private auth: AuthService,
    private countryService: CountryService,
    private storage: StorageService,
    private router: Router
  ) {}

  async ngOnInit() {
    const countryCode = await this.countryService.getCountryCode();
    this.dialCode = this.countryService.getDialCode(countryCode);

    const registeredPhone = await this.storage.get<string>('registered_phone');
    if (registeredPhone) {
      this.phoneNumber = registeredPhone;
      this.isPhoneReadOnly = true;
    }
    await this.refreshEligibility(registeredPhone || undefined);
  }

  get fullPhoneNumber(): string {
    const cleaned = this.phoneNumber.replace(/[^+\d]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    return this.dialCode + cleaned;
  }

  get phoneError(): string {
    if (!this.phoneTouched) return '';
    return this.phoneValidationError;
  }

  private get phoneValidationError(): string {
    if (!this.phoneNumber) return 'Phone number is required';
    const cleaned = this.fullPhoneNumber.replace(/[^+\d]/g, '');
    if (cleaned.length < 8) return 'Enter a valid phone number (at least 8 digits)';
    return '';
  }

  get isPhoneValid(): boolean {
    return !this.phoneValidationError;
  }

  get isPasswordValid(): boolean {
    return this.password.trim().length > 0;
  }

  get passwordError(): string {
    if (!this.passwordTouched) return '';
    if (!this.password) return 'Password is required';
    if (!this.isPasswordValid) return 'Enter your password';
    return '';
  }

  get isFormValid(): boolean {
    return this.canLogin && this.isPhoneValid && this.isPasswordValid;
  }

  get deviceIsNew(): boolean {
    return this.eligibility?.deviceStatus === 'New';
  }

  get needsPhoneNumber(): boolean {
    return this.eligibility?.deviceStatus === 'Registered' && !this.phoneNumber;
  }

  get canLogin(): boolean {
    return this.eligibility?.canLogin === true;
  }

  private async registerPhone(phone: string) {
    await this.storage.set('registered_phone', phone);
  }

  async checkPhoneEligibility(): Promise<void> {
    this.phoneTouched = true;
    if (!this.isPhoneValid) return;
    await this.refreshEligibility(this.fullPhoneNumber);
  }

  async sendOtp() {
    await this.refreshEligibility(this.fullPhoneNumber);
    if (!this.canLogin) {
      this.showMessage(this.eligibility?.message || 'This device is not eligible to sign in.', 'error');
      return;
    }
    if (!this.isFormValid) {
      this.phoneTouched = true;
      this.passwordTouched = true;
      this.showMessage('Please fix the errors above.', 'error');
      return;
    }

    this.isLoading = true;
    this.showMessage('Sending OTP...', 'info');

    const otpRequest = await this.auth.sendLoginOtp(this.fullPhoneNumber, this.password);
    otpRequest
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response?.phone) {
            this.registerPhone(response.phone);
          } else {
            this.registerPhone(this.fullPhoneNumber);
          }
          this.showMessage('OTP sent successfully!', 'success');
          this.router.navigate(['/otp'], {
            state: { phone: this.fullPhoneNumber, password: this.password }
          });
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'Failed to send OTP. Please try again.';
          this.showMessage(errorMsg, 'error');
        }
      });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  async useDifferentNumber(): Promise<void> {
    await this.storage.remove('registered_phone');
    this.phoneNumber = '';
    this.password = '';
    this.isPhoneReadOnly = false;
    this.phoneTouched = false;
    this.passwordTouched = false;
    await this.refreshEligibility();
  }

  async retryEligibility(): Promise<void> {
    await this.refreshEligibility(this.phoneNumber && this.isPhoneValid ? this.fullPhoneNumber : undefined);
  }

  private async refreshEligibility(phoneNumber?: string): Promise<void> {
    this.isCheckingEligibility = true;
    try {
      const request = await this.auth.getAccessEligibility(phoneNumber);
      this.eligibility = await firstValueFrom(request);
      if (this.eligibility.canLogin && phoneNumber) {
        await this.registerPhone(phoneNumber);
        this.isPhoneReadOnly = true;
      }
    } catch (error) {
      console.error('Unable to check login eligibility.', error);
      this.eligibility = null;
      this.showMessage('Unable to verify this device. Check your connection and try again.', 'error');
    } finally {
      this.isCheckingEligibility = false;
    }
  }

  private showMessage(text: string, type: 'info' | 'success' | 'error') {
    this.message = text;
    this.messageType = type;
  }
}
