import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { environment } from './../../../../environments/environment';

/**
 * Storage for secrets which must never be persisted with Capacitor Preferences
 * on a released mobile app. Android is backed by AES-GCM with a key in Android
 * KeyStore; iOS is backed by the system Keychain.
 */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private readonly prefix = 'verixora_secure_';

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);

    if (Capacitor.isNativePlatform()) {
      await SecureStorage.setItem(this.getKey(key), serialized);
      return;
    }

    this.ensureBrowserIsDevelopmentOnly();
    await Preferences.set({ key: this.getKey(key), value: serialized });
  }

  async get<T>(key: string): Promise<T | null> {
    let serialized: string | null;

    if (Capacitor.isNativePlatform()) {
      serialized = await SecureStorage.getItem(this.getKey(key));
    } else {
      this.ensureBrowserIsDevelopmentOnly();
      const result = await Preferences.get({ key: this.getKey(key) });
      serialized = result.value;
    }

    if (!serialized) {
      return null;
    }

    try {
      return JSON.parse(serialized) as T;
    } catch {
      await this.remove(key);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await SecureStorage.removeItem(this.getKey(key));
      return;
    }

    await Preferences.remove({ key: this.getKey(key) });
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private ensureBrowserIsDevelopmentOnly(): void {
    if (environment.production) {
      throw new Error('Secure mobile storage is required. The mobile app cannot store credentials in a production browser.');
    }
  }
}
