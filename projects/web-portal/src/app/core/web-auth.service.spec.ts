import { Router } from '@angular/router';
import { of } from 'rxjs';
import { WebApiService } from './web-api.service';
import { WebAuthService } from './web-auth.service';

describe('WebAuthService', () => {
  const storageKey = 'verixora_web_session';
  let api: jasmine.SpyObj<WebApiService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sessionStorage.clear();
    api = jasmine.createSpyObj<WebApiService>('WebApiService', ['post']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  it('clears an expired browser portal session', () => {
    sessionStorage.setItem(storageKey, JSON.stringify({ token: 'expired', userId: 'user-1', expiresAt: Date.now() - 1 }));
    const service = new WebAuthService(api, router);

    expect(service.token()).toBeNull();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
  });

  it('stores the token only after successful web OTP login', () => {
    const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 }))}.signature`;
    api.post.and.returnValue(of({ token, userId: 'user-1' }));
    const service = new WebAuthService(api, router);

    service.login('user@example.com', 'password', '123456').subscribe();

    expect(service.isAuthenticated()).toBeTrue();
    expect(JSON.parse(sessionStorage.getItem(storageKey) ?? '{}').userId).toBe('user-1');
  });
});
