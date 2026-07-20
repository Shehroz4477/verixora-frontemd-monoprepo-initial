# Verixora web and Android build guide

This repository contains the Angular web portal and the Android Capacitor application. Android is the supported mobile target for this phase; iOS is intentionally deferred.

## Prerequisites

- Node.js 20 or later and npm.
- Android Studio with Android SDK Platform 33 installed.
- Microsoft OpenJDK 17. Android Gradle Plugin 8 requires JDK 17; a newer Android Studio JBR must not be substituted for this command-line build.

For a PowerShell session where JDK 17 is not already on `PATH`:

```powershell
$jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory |
  Where-Object { $_.Name -like '*jdk-17*' } |
  Sort-Object Name -Descending |
  Select-Object -First 1
$env:JAVA_HOME = $jdk.FullName
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Set `ANDROID_SDK_ROOT` to the Android SDK location when it is not already configured.

## Build and verify

Run these commands from the repository root:

```powershell
npm ci
npm run build:web
npm run build:mobile
npx cap sync android
Set-Location android
.\gradlew.bat assembleDebug --no-daemon
.\gradlew.bat assembleRelease --no-daemon
```

The debug APK is written below `android\app\build\outputs\apk\debug`. A release build is only a compile artifact until it is signed; never distribute an unsigned APK.

## API targets

- The browser development portal uses `http://localhost:5166/api/v1`.
- The Android emulator uses `http://10.0.2.2:5166/api/v1` only in a debug build.
- A physical Android device and every release build must use the trusted HTTPS API endpoint configured in `environment.prod.ts`.

The debug network-security policy permits cleartext only for `localhost` and `10.0.2.2`. Release builds explicitly prohibit cleartext traffic.

## Release signing

Create and protect the release signing key in the organisation's secret store. Configure its path, alias, and passwords through CI/CD secret variables or an ignored local `keystore.properties` file. Do not commit a keystore, signing password, API secret, OTP secret, or production configuration.

Before publishing, build an Android App Bundle (`bundleRelease`), sign it with the production key, test it on a real device, and retain the signing key in a recoverable controlled vault. Losing the signing key prevents future Play Store updates.

## Security behaviour

- Android backups are disabled so secure mobile credentials are not exported by the OS backup service.
- Tokens use native secure storage, not browser preferences in a release app.
- The mobile device key is P-256 in Android Keystore; its private key never enters the WebView.
- A reinstall creates a new Keystore key. Recovery is permitted only after password + SMS OTP validation from the same registered Android device identifier; the backend then rotates the stored public key.
- Nearby door unlock uses BLE challenge signing after the server has created an expiry-limited command. It does not replace physical egress or manual-key safety hardware.

## Hardware test boundary

The APK build verifies the native plugins compile. It does not prove Bluetooth range, controller provisioning, camera quality, face anti-spoofing, relay operation, or emergency egress. Those require the purchased ESP32 controller, lock hardware, a real Android phone, and the hardware-in-the-loop checklist.
