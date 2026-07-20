import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { environment } from './../../../../environments/environment';

interface AndroidDeviceKeyPlugin {
  getOrCreateKey(): Promise<{ publicKeySpkiBase64: string; fingerprint: string; hardwareBacked: boolean }>;
  sign(options: { payload: string }): Promise<{ signatureBase64: string }>;
}

const AndroidDeviceKey = registerPlugin<AndroidDeviceKeyPlugin>('VerixoraDeviceKey');

@Injectable({ providedIn: 'root' })
export class DeviceService {
  async getDeviceBinding(): Promise<{ deviceId: string; deviceFingerprint: string; devicePublicKeySpkiBase64: string }> {
    if (Capacitor.getPlatform() !== 'android') {
      throw new Error(environment.production
        ? 'A production account must be registered from the Android application.'
        : 'Use the Android emulator or device to test cryptographic device binding.');
    }

    const [nativeId, key] = await Promise.all([Device.getId(), AndroidDeviceKey.getOrCreateKey()]);
    if (!nativeId.identifier) throw new Error('Android device identifier is unavailable.');
    if (!key.hardwareBacked && environment.production) {
      throw new Error('This device does not provide a hardware-backed Android Keystore key.');
    }

    return {
      deviceId: nativeId.identifier,
      deviceFingerprint: key.fingerprint,
      devicePublicKeySpkiBase64: key.publicKeySpkiBase64
    };
  }

  async signPresencePayload(payload: string): Promise<string> {
    if (Capacitor.getPlatform() !== 'android') throw new Error('Nearby-door proof requires the Android application.');
    return (await AndroidDeviceKey.sign({ payload })).signatureBase64;
  }
}
