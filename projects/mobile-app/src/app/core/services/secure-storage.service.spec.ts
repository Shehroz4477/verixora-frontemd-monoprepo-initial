import { SecureStorageService } from './secure-storage.service';

class TestNativeSecureStorageService extends SecureStorageService {
  readonly writes: Array<{ key: string; value: string }> = [];
  readonly removed: string[] = [];
  storedValue: string | null = null;

  protected override useNativeStorage(): boolean {
    return true;
  }

  protected override writeNative(key: string, value: string): Promise<void> {
    this.writes.push({ key, value });
    return Promise.resolve();
  }

  protected override readNative(): Promise<string | null> {
    return Promise.resolve(this.storedValue);
  }

  protected override removeNative(key: string): Promise<void> {
    this.removed.push(key);
    return Promise.resolve();
  }
}

describe('SecureStorageService', () => {
  let service: TestNativeSecureStorageService;

  beforeEach(() => {
    service = new TestNativeSecureStorageService();
  });

  it('uses the native secure store and namespaces the credential key', async () => {
    await service.set('auth', { token: 'development-token' });

    expect(service.writes).toEqual([{
      key: 'verixora_secure_auth',
      value: JSON.stringify({ token: 'development-token' })
    }]);
  });

  it('removes malformed native cached data instead of returning it as an authenticated session', async () => {
    service.storedValue = '{not-json';

    await expectAsync(service.get<{ token: string }>('auth')).toBeResolvedTo(null);
    expect(service.removed).toEqual(['verixora_secure_auth']);
  });
});
