import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';
import { StorageService } from './storage.service';
import { SecureStorageService } from './secure-storage.service';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private bindingKey = 'device_binding_key';
  private installationKey = 'device_installation_id';

  constructor(
    private storage: StorageService,
    private secureStorage: SecureStorageService
  ) {}

  async getDeviceBinding(): Promise<{ deviceId: string; deviceFingerprint: string }> {
    const [nativeId, storedKey, storedInstallation] = await Promise.all([
      Device.getId(),
      this.secureStorage.get<string>(this.bindingKey),
      this.storage.get<string>(this.installationKey)
    ]);
    const deviceId = nativeId.identifier || storedInstallation || crypto.randomUUID();
    const deviceFingerprint = storedKey || this.createBindingKey();

    await Promise.all([
      this.storage.set(this.installationKey, deviceId),
      this.secureStorage.set(this.bindingKey, deviceFingerprint)
    ]);
    return { deviceId, deviceFingerprint };
  }

  private createBindingKey(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  }
}
