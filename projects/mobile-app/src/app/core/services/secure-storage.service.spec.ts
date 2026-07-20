import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStorageService } from './secure-storage.service';

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeEach(() => {
    service = new SecureStorageService();
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
  });

  it('namespaces browser-development credentials before writing them', async () => {
    const setItem = spyOn(Preferences, 'set').and.resolveTo();

    await service.set('auth', { token: 'development-token' });

    expect(setItem).toHaveBeenCalledWith({
      key: 'verixora_secure_auth',
      value: JSON.stringify({ token: 'development-token' })
    });
  });

  it('removes malformed cached data instead of returning it as an authenticated session', async () => {
    spyOn(Preferences, 'get').and.resolveTo({ value: '{not-json' });
    const removeItem = spyOn(Preferences, 'remove').and.resolveTo();

    await expectAsync(service.get<{ token: string }>('auth')).toBeResolvedTo(null);
    expect(removeItem).toHaveBeenCalledWith({ key: 'verixora_secure_auth' });
  });
});
