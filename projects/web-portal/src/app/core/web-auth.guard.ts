import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { WebAuthService } from './web-auth.service';

@Injectable({ providedIn: 'root' })
export class WebAuthGuard implements CanActivate {
  constructor(private auth: WebAuthService, private router: Router) {}

  canActivate(): boolean {
    return this.auth.isAuthenticated() || (this.router.navigate(['/login']), false);
  }
}
