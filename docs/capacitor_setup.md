```markdown
# Capacitor Setup & Android Studio Installation Guide

## 1. Prerequisites
- **Node.js** (v20.11.0 or higher) – download from [nodejs.org](https://nodejs.org)
- **npm** (comes with Node)
- **Angular project** already created (if not, use the main setup guide)

---

## 2. Install Capacitor Dependencies

From your **project root** (where `angular.json` is located):

```powershell
npm install @capacitor/core@5.7.0 @capacitor/cli@5.7.0 @capacitor/android@5.7.0 --save-dev --legacy-peer-deps
```

This installs the specific Capacitor 5.7.0 versions that are compatible with Angular 18 and Ionic 7.

 # Remove Android project                                            
>> Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue
>>                                  
>> # Remove Capacitor config files (both .json and .ts)
>> Remove-Item -Force capacitor.config.json -ErrorAction SilentlyContinue
>> Remove-Item -Force capacitor.config.ts -ErrorAction SilentlyContinue

---

## 3. Create `capacitor.config.json`

In your project root, create a file named `capacitor.config.json` with the following content:

```json
{
  "appId": "com.verixora.mobile",
  "appName": "Verixora.Mobile",
  "webDir": "dist/mobile-app",
  "server": {
    "androidScheme": "https"
  }
}
```

*(If you already have a `capacitor.config.ts` file, delete it first to avoid conflicts.)*

---

## 4. Initialize Capacitor

```powershell
npx cap init Verixora.Mobile com.verixora.mobile
```

This reads the config file and sets up the Capacitor project.

---

## 5. Add Android Platform

```powershell
npx cap add android
```

This creates the `android/` folder with the native Android project.

---

## 6. Build the Angular App (web assets)

**Before syncing**, you must build the Angular app so that the `dist/mobile-app` folder exists:

```powershell
npx ng build mobile-app
```

---

## 7. Sync with Capacitor

```powershell
npx cap sync android
```

This copies the web assets from `dist/mobile-app` into the Android project.

---

## 8. Install Android Studio (Required for building APKs)

### 8.1 Download Android Studio
- Go to [developer.android.com/studio](https://developer.android.com/studio)
- Download the **Windows installer** (`.exe`).

### 8.2 Install Android Studio
- Run the installer.
- Keep the default options.
- Make sure **Android SDK**, **Android SDK Platform-Tools**, and **Android Emulator** are selected.
- Complete the installation.

### 8.3 Launch Android Studio
- On the welcome screen, click **More Actions** → **SDK Manager**.
- Under **SDK Platforms**, select **Android 13 (API 33)** or newer.
- Under **SDK Tools**, ensure these are checked:
  - Android SDK Build-Tools
  - Android SDK Platform-Tools
  - Android Emulator (optional)
- Click **Apply** and let it download.

### 8.4 Note the SDK Location
- In the SDK Manager, copy the **Android SDK Location** path (e.g., `C:\Users\YourUser\AppData\Local\Android\Sdk`).  
  You'll need this for the environment variable.

---

## 9. Set Environment Variables

You need to set `ANDROID_SDK_ROOT` and `ANDROID_HOME` so the build tools can find the SDK.

### 9.1 Temporary (for current PowerShell session)
```powershell
$env:ANDROID_SDK_ROOT = "C:\Users\YourUser\AppData\Local\Android\Sdk"
$env:ANDROID_HOME = "C:\Users\YourUser\AppData\Local\Android\Sdk"
```
*(Replace the path with your actual SDK location.)*

### 9.2 Permanent (recommended – so you don't have to set it every time)
1. Press `Win + R`, type `sysdm.cpl`, and hit Enter.
2. Go to **Advanced** → **Environment Variables**.
3. Under **System variables**, click **New** and add:
   - **Variable name**: `ANDROID_SDK_ROOT`
   - **Variable value**: your SDK path
4. Add another one:
   - **Variable name**: `ANDROID_HOME`
   - **Variable value**: same SDK path
5. Click **OK** and restart your terminal.

---

## 10. Run the App on Your Physical Device

### 10.1 Connect Your Phone
- Enable **Developer Options** on your phone (tap Build Number 7 times in Settings → About Phone).
- Enable **USB Debugging**.
- Connect your phone via USB cable.

### 10.2 Verify Device Detection
```powershell
adb devices
```
Your device should appear in the list.

### 10.3 Run via Capacitor Command Line
```powershell
npx cap run android
```

If the command fails (e.g., `ERR_SDK_NOT_FOUND`), try the next step.

### 10.4 Run via Android Studio (Most Reliable)
```powershell
npx cap open android
```
This opens Android Studio with your project. Then:
- Wait for Gradle sync to complete.
- Click the green **Run** button (▶).
- Select your connected device.
- The app will install and launch.

---

## 11. What to Expect

- The app will install on your phone.
- It will launch automatically.
- You'll see the Verixora **Login page** with the dark theme.
- Test the mock login:
  - Enter any phone number and password.
  - Click **Send OTP** → OTP input appears.
  - Enter `123456` → login succeeds.
  - Enter `111111` → login fails (mock error).

---

## 12. Troubleshooting

| Issue | Solution |
|-------|----------|
| `ERR_SDK_NOT_FOUND` | Make sure environment variables are set correctly. Create `android/local.properties` with `sdk.dir=C\:\\Users\\YourUser\\AppData\\Local\\Android\\Sdk` |
| `adb devices` shows nothing | Check USB cable, re‑enable USB Debugging, restart ADB with `adb kill-server` then `adb start-server` |
| Build fails in Android Studio | Open SDK Manager and install missing components (Platform 33, Build Tools). |
| `npx cap run android` not working | Use `npx cap open android` and run from Android Studio instead. |

---

## 13. Next Steps

Once the app is running on your phone, you can continue building:

- **Dashboard** – list of doors with unlock buttons.
- **Face Enrollment** – capture photos for face AI.
- **Unlock with Face** – camera capture and verification.
- **BLE Provisioning** – connect to ESP32.

---

**You are now ready to develop and test on a real device.**
```