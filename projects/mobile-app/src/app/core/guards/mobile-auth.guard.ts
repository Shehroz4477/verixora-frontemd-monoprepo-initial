import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const mobileAuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return await auth.isAuthenticatedAfterInitialization()
    ? true
    : router.createUrlTree(['/login']);
};
