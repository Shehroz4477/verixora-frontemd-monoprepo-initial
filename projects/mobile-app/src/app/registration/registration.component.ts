import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { CountryService, Country } from '../core/services/country.service';
import { StorageService } from '../core/services/storage.service';
import { CountrySelectorModalComponent } from '../country-selector-modal/country-selector-modal.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
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
    private countryService: CountryService,
    private storage: StorageService,
    private modalController: ModalController,
    private router: Router
  ) {}

  async ngOnInit() {
    const detectedCode = await this.countryService.getCountryCode();
    this.selectedCountry = this.countryService.getCountryByCode(detectedCode);
  }

  // Country‑specific validation
  get phoneError(): string {
    if (!this.phoneTouched) return '';
    if (!this.phoneNumber) return 'Phone number is required';

    const cleaned = this.phoneNumber.replace(/\s/g, '');
    if (!this.selectedCountry) return 'Please select a country';

    const country = this.selectedCountry;
    const digitsOnly = cleaned.replace(/[^+\d]/g, '');
    // Remove the dial code prefix if present
    let localDigits = digitsOnly;
    if (localDigits.startsWith(country.dial)) {
      localDigits = localDigits.substring(country.dial.length);
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
    return !this.phoneError;
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
    return this.isPhoneValid &&
           this.isPasswordValid &&
           this.isConfirmValid &&
           !this.emailError;
  }

  get fullPhoneNumber(): string {
    if (!this.selectedCountry) return this.phoneNumber;
    const cleaned = this.phoneNumber.replace(/\s/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    return this.selectedCountry.dial + cleaned;
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
      }
    });
    await modal.present();
  }

  private async registerPhone(phone: string) {
    await this.storage.set('registered_phone', phone);
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

    this.isLoading = true;
    this.showMessage('Sending OTP...', 'info');

    this.auth.sendRegistrationOtp(this.fullPhoneNumber)
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
          const errorMsg = err.error?.error || 'Failed to send OTP. Please try again.';
          this.showMessage(errorMsg, 'error');
        }
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private showMessage(text: string, type: 'info' | 'success' | 'error') {
    this.message = text;
    this.messageType = type;
  }
}
