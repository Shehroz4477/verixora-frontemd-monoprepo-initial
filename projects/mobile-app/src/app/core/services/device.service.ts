import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private fingerprintKey = 'device_fingerprint';

  constructor(private storage: StorageService) {}

  async getDeviceFingerprint(): Promise<string> {
    const stored = await this.storage.get<string>(this.fingerprintKey);
    if (stored) return stored;

    const info = await Device.getInfo();
    const id = await Device.getId();
    const fingerprint = `${id.identifier}-${info.model}-${info.platform}`;

    await this.storage.set(this.fingerprintKey, fingerprint);
    return fingerprint;
  }
}