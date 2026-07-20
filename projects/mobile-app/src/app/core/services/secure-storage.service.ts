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
    const storageKey = this.getKey(key);

    if (this.useNativeStorage()) {
      await this.writeNative(storageKey, serialized);
      return;
    }

    this.ensureBrowserIsDevelopmentOnly();
    await this.writeBrowser(storageKey, serialized);
  }

  async get<T>(key: string): Promise<T | null> {
    let serialized: string | null;
    const storageKey = this.getKey(key);

    if (this.useNativeStorage()) {
      serialized = await this.readNative(storageKey);
    } else {
      this.ensureBrowserIsDevelopmentOnly();
      serialized = await this.readBrowser(storageKey);
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
    const storageKey = this.getKey(key);
    if (this.useNativeStorage()) {
      await this.removeNative(storageKey);
      return;
    }

    await this.removeBrowser(storageKey);
  }

  protected useNativeStorage(): boolean {
    return Capacitor.isNativePlatform();
  }

  protected writeNative(key: string, value: string): Promise<void> {
    return SecureStorage.setItem(key, value);
  }

  protected readNative(key: string): Promise<string | null> {
    return SecureStorage.getItem(key);
  }

  protected removeNative(key: string): Promise<void> {
    return SecureStorage.removeItem(key);
  }

  protected writeBrowser(key: string, value: string): Promise<void> {
    return Preferences.set({ key, value });
  }

  protected async readBrowser(key: string): Promise<string | null> {
    return (await Preferences.get({ key })).value;
  }

  protected removeBrowser(key: string): Promise<void> {
    return Preferences.remove({ key });
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
