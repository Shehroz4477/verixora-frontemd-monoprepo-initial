import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private prefix = 'verixora_';

  async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key: this.prefix + key,
      value: JSON.stringify(value)
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await Preferences.get({ key: this.prefix + key });
    if (!result.value) return null;
    return JSON.parse(result.value) as T;
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key: this.prefix + key });
  }

  async clear(): Promise<void> {
    await Preferences.clear();
  }
}