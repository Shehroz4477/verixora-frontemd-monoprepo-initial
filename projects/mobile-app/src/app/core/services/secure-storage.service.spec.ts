import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { SecureStorageService } from './secure-storage.service';

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeEach(() => {
    service = new SecureStorageService();
  });

  it('uses the native secure store and namespaces the credential key', async () => {
    const setItem = spyOn(SecureStorage, 'setItem').and.resolveTo();

    await service.set('auth', { token: 'development-token' });

    expect(setItem).toHaveBeenCalledWith('verixora_secure_auth', JSON.stringify({ token: 'development-token' }));
  });

  it('removes malformed native cached data instead of returning it as an authenticated session', async () => {
    spyOn(SecureStorage, 'getItem').and.resolveTo('{not-json');
    const removeItem = spyOn(SecureStorage, 'removeItem').and.resolveTo();

    await expectAsync(service.get<{ token: string }>('auth')).toBeResolvedTo(null);
    expect(removeItem).toHaveBeenCalledWith('verixora_secure_auth');
  });
});
