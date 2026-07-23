import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface AndroidSoftKeyboardPlugin {
  show(): Promise<{ requested: boolean }>;
}

const AndroidSoftKeyboard = registerPlugin<AndroidSoftKeyboardPlugin>('VerixoraSoftKeyboard');

@Injectable({ providedIn: 'root' })
export class SoftKeyboardService {
  /** Requests the native Android keyboard only after a user-focused WebView field. */
  async showForFocusedInput(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return;

    try {
      await AndroidSoftKeyboard.show();
    } catch (error) {
      // The input remains usable if the OS declines a programmatic keyboard request.
      console.warn('Android soft keyboard request was not accepted.', error);
    }
  }
}
