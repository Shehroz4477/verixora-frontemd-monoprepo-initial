import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AuthAccessEligibility, AuthService } from '../core/services/auth.service';
import { CountryService, Country } from '../core/services/country.service';
import { ApiService } from '../core/services/api.service';
import { CountrySelectorModalComponent } from '../country-selector-modal/country-selector-modal.component';
import { SoftKeyboardService } from '../core/services/soft-keyboard.service';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-registration',
    templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.scss'],
    standalone: false
})
export class RegistrationComponent implements OnInit {
  phoneNumber: string = '';
  password: string = '';
  confirmPassword: string = '';
  email: string = '';

  selectedCountry: Country | null = null;
  message: string = '';
  messageType: 'info' | 'success' | 'error' = 'info';
  isLoading: boolean = false;
  isCheckingEligibility: boolean = true;
  eligibility: AuthAccessEligibility | null = null;
  phoneTouched: boolean = false;
  passwordTouched: boolean = false;
  confirmTouched: boolean = false;
  emailTouched: boolean = false;

  passwordChecks = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private countryService: CountryService,
    private modalController: ModalController,
    private softKeyboard: SoftKeyboardService,
    private router: Router
  ) {}

  async ngOnInit() {
    const detectedCode = await this.countryService.getCountryCode();
    this.selectedCountry = this.countryService.getCountryByCode(detectedCode);
    await this.refreshEligibility();
  }

  // Country‑specific validation
  get phoneError(): string {
    if (!this.phoneTouched) return '';
    return this.phoneValidationError;
  }

  private get phoneValidationError(): string {
    if (!this.phoneNumber) return 'Phone number is required';

    const cleaned = this.phoneNumber.replace(/\s/g, '');
    if (!this.selectedCountry) return 'Please select a country';

    const country = this.selectedCountry;
    const dialDigits = country.dial.replace(/\D/g, '');
    const digitsOnly = cleaned.replace(/[^+\d]/g, '');
    // Remove the dial code prefix if present
    let localDigits = digitsOnly;
    if (localDigits.startsWith(dialDigits)) {
      localDigits = localDigits.substring(dialDigits.length);
    }
    // Remove leading zero if any
    localDigits = localDigits.replace(/^0+/, '');

    const len = localDigits.length;
    if (len < country.minDigits || len > country.maxDigits) {
      return `Please enter ${country.minDigits}–${country.maxDigits} digits for ${country.name}`;
    }
    return '';
  }

  get isPhoneValid(): boolean {
    return !this.phoneValidationError;
  }

  // Password validation (unchanged)
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

  get confirmPasswordError(): string {
    if (!this.confirmTouched) return '';
    if (!this.confirmPassword) return 'Please confirm your password';
    if (this.password !== this.confirmPassword) return 'Passwords do not match';
    return '';
  }

  get isConfirmValid(): boolean {
    return this.password === this.confirmPassword && this.confirmPassword.length > 0;
  }

  get emailError(): string {
    if (!this.emailTouched) return '';
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      return 'Enter a valid email address';
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.canRegister &&
           this.isPhoneValid &&
           this.isPasswordValid &&
           this.isConfirmValid &&
           !this.emailError;
  }

  get fullPhoneNumber(): string {
    if (!this.selectedCountry) return this.phoneNumber;
    const cleaned = this.phoneNumber.replace(/[^+\d]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    const dialDigits = this.selectedCountry.dial.replace(/\D/g, '');
    const digitsOnly = cleaned.replace(/\D/g, '');
    const withoutRepeatedDialCode = digitsOnly.startsWith(dialDigits)
      ? digitsOnly.substring(dialDigits.length)
      : digitsOnly;
    return this.selectedCountry.dial + withoutRepeatedDialCode.replace(/^0+/, '');
  }

  get canRegister(): boolean {
    return this.eligibility?.canRegister === true;
  }

  async openCountrySelector() {
    const modal = await this.modalController.create({
      component: CountrySelectorModalComponent,
      backdropDismiss: true
    });
    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.selectedCountry = result.data;
        // Clear the phone number so user can re‑enter with new country
        this.phoneNumber = '';
        this.phoneTouched = false;
        this.refreshEligibility();
      }
    });
    await modal.present();
  }

  async checkPhoneEligibility(): Promise<void> {
    this.phoneTouched = true;
    if (!this.isPhoneValid) return;
    await this.refreshEligibility(this.fullPhoneNumber);
  }

  onFieldFocus(field: 'phone' | 'password' | 'confirm' | 'email'): void {
    if (field === 'phone') this.phoneTouched = true;
    if (field === 'password') this.passwordTouched = true;
    if (field === 'confirm') this.confirmTouched = true;
    if (field === 'email') this.emailTouched = true;
    void this.softKeyboard.showForFocusedInput();
  }

  async register() {
    if (!this.isFormValid) {
      this.phoneTouched = true;
      this.passwordTouched = true;
      this.confirmTouched = true;
      this.emailTouched = true;
      this.showMessage('Please fix the errors above.', 'error');
      return;
    }

    await this.refreshEligibility(this.fullPhoneNumber);
    if (!this.canRegister) {
      this.showMessage(this.eligibility?.message || 'Registration is not available for this device and number.', 'error');
      return;
    }

    this.isLoading = true;
    this.showMessage('Sending OTP...', 'info');

    const otpRequest = await this.auth.sendRegistrationOtp(this.fullPhoneNumber);
    otpRequest
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.showMessage('OTP sent successfully!', 'success');
          this.router.navigate(['/otp'], {
            state: {
              phone: this.fullPhoneNumber,
              password: this.password,
              email: this.email,
              isRegistration: true
            }
          });
        },
        error: (err) => {
          console.error('Registration OTP request failed.', {
            status: err?.status,
            url: err?.url,
            message: err?.message,
            error: err?.error
          });
          this.showMessage(this.describeOtpError(err), 'error');
        }
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async retryEligibility(): Promise<void> {
    await this.refreshEligibility(this.phoneNumber && this.isPhoneValid ? this.fullPhoneNumber : undefined);
  }

  private async refreshEligibility(phoneNumber?: string): Promise<void> {
    this.isCheckingEligibility = true;
    try {
      const request = await this.auth.getAccessEligibility(phoneNumber);
      this.eligibility = await firstValueFrom(request);
    } catch (error) {
      console.error('Unable to check registration eligibility.', error);
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

  private describeOtpError(error: any): string {
    const serverMessage = error?.error?.error || error?.error?.title;
    if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage;

    if (error?.status === 0) {
      return `Network request did not reach the API: ${this.api.configuredBaseUrl}`;
    }

    const status = Number.isInteger(error?.status) ? `HTTP ${error.status}` : 'unknown error';
    return `OTP request failed (${status}): ${error?.message || 'No error details returned.'}`;
  }
}
