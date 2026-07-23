import { of } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  it('saves an email before sending and verifying the email OTP on the trusted device', async () => {
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['isMockMode', 'logout']);
    auth.isMockMode.and.returnValue(false);
    api.post.and.returnValues(
      of({ success: true, message: 'Email saved.' }),
      of({ success: true, message: 'Code sent.' }),
      of({ success: true, message: 'Email verified.' })
    );
    const component = new ProfileComponent(jasmine.createSpyObj('Router', ['navigate']), auth, api);
    component.email = 'owner@example.com';

    await component.saveEmail();
    await component.sendVerificationCode();
    component.verificationCode = '123456';
    await component.verifyEmail();

    expect(api.post).toHaveBeenCalledWith('/auth/set-email', { email: 'owner@example.com' });
    expect(api.post).toHaveBeenCalledWith('/auth/send-verification-email', {});
    expect(api.post).toHaveBeenCalledWith('/auth/verify-email', { code: '123456' });
    expect(component.verificationCode).toBe('');
    expect(component.message).toBe('Email verified.');
  });

  it('restores the verified email state after navigating back to the profile', async () => {
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['isMockMode', 'logout']);
    auth.isMockMode.and.returnValue(false);
    api.get.and.returnValue(of({ email: 'owner@example.com', isVerified: true }));
    const component = new ProfileComponent(jasmine.createSpyObj('Router', ['navigate']), auth, api);

    await (component as any).loadEmailStatus();

    expect(api.get).toHaveBeenCalledWith('/auth/email-status');
    expect(component.email).toBe('owner@example.com');
    expect(component.emailSaved).toBeTrue();
    expect(component.emailVerified).toBeTrue();
    expect(component.isLoadingEmailStatus).toBeFalse();
  });
});
