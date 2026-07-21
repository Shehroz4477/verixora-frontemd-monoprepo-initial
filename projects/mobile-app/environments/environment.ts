export const environment = {
  production: false,

  // Backend API base URL
  apiUrl: 'http://localhost:5166/api/v1',
  // Android emulator reaches the host machine through this special address.
  androidEmulatorApiUrl: 'http://10.0.2.2:5166/api/v1',
  // Update this host and the debug network-security XML if this PC's Wi-Fi IP changes.
  androidPhysicalDeviceApiUrl: 'http://192.168.0.102:5166/api/v1',
  androidDebugTarget: 'physical' as const,

  // Mock mode – set to true while backend is not ready
  useMock: false,

  // Local storage key for auth data (Capacitor Storage will use this)
  authStorageKey: 'verixora_auth'
};
