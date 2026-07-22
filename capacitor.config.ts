import type { CapacitorConfig } from '@capacitor/cli';

// Local Android debugging uses an HTTP WebView origin so it can call the local
// HTTP API without browser mixed-content blocking. Set VERIXORA_ANDROID_SCHEME=https
// before `npx cap sync android` for an HTTPS production/staging API build.
const androidScheme = process.env['VERIXORA_ANDROID_SCHEME'] ?? 'http';

if (androidScheme !== 'http' && androidScheme !== 'https') {
  throw new Error('VERIXORA_ANDROID_SCHEME must be either http or https.');
}

const config: CapacitorConfig = {
  appId: 'com.verixora.mobile',
  appName: 'Verixora.Mobile',
  webDir: 'dist/mobile-app',
  server: {
    androidScheme
  }
};

export default config;
