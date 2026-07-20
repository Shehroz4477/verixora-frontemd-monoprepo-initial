import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { WebAuthService } from '../core/web-auth.service';

@Component({
    selector: 'app-web-login',
    templateUrl: './web-login.component.html',
    styleUrls: ['./web-login.component.scss'],
    standalone: false
})
export class WebLoginComponent {
  email = '';
  password = '';
  otp = '';
  otpRequested = false;
  loading = false;
  error = '';

  constructor(private auth: WebAuthService, private router: Router) {}

  requestOtp(): void {
    this.error = '';
    this.loading = true;
    this.auth.sendOtp(this.email.trim(), this.password).subscribe({
      next: () => { this.otpRequested = true; this.loading = false; },
      error: error => { this.error = error.error?.error || 'Could not send an OTP. Confirm that this email is verified in the mobile app.'; this.loading = false; }
    });
  }

  login(): void {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email.trim(), this.password, this.otp.trim()).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: error => { this.error = error.error?.error || 'Web login was rejected.'; this.loading = false; }
    });
  }
}
