import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { CountryService } from '../core/services/country.service';
import { StorageService } from '../core/services/storage.service';
import { finalize } from 'rxjs/operators';

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
  phoneTouched: boolean = false;
  passwordTouched: boolean = false;

  passwordChecks = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

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
  }

  get fullPhoneNumber(): string {
    const cleaned = this.phoneNumber.replace(/[^+\d]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    return this.dialCode + cleaned;
  }

  get phoneError(): string {
    if (!this.phoneTouched) return '';
    if (!this.phoneNumber) return 'Phone number is required';
    const cleaned = this.fullPhoneNumber.replace(/[^+\d]/g, '');
    if (cleaned.length < 8) return 'Enter a valid phone number (at least 8 digits)';
    return '';
  }

  get isPhoneValid(): boolean {
    return !this.phoneError;
  }

  get isPasswordValid(): boolean {
    const pwd = this.password;
    this.passwordChecks.minLength = pwd.length >= 8;
    this.passwordChecks.hasUppercase = /[A-Z]/.test(pwd);
    this.passwordChecks.hasLowercase = /[a-z]/.test(pwd);
    this.passwordChecks.hasNumber = /\d/.test(pwd);
    this.passwordChecks.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return pwd.length >= 8 &&
           /[A-Z]/.test(pwd) &&
           /[a-z]/.test(pwd) &&
           /\d/.test(pwd) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  }

  get passwordError(): string {
    if (!this.passwordTouched) return '';
    if (!this.password) return 'Password is required';
    if (!this.isPasswordValid) return 'Password does not meet requirements';
    return '';
  }

  get isFormValid(): boolean {
    return this.isPhoneValid && this.isPasswordValid;
  }

  private async registerPhone(phone: string) {
    await this.storage.set('registered_phone', phone);
  }

  async sendOtp() {
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

  private showMessage(text: string, type: 'info' | 'success' | 'error') {
    this.message = text;
    this.messageType = type;
  }
}
